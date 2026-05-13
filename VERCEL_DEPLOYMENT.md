# Vercel Deployment Guide for FreddyChatroom

Complete step-by-step guide to deploy your chatroom to Vercel with MongoDB Atlas.

## Prerequisites

- Vercel account (free at https://vercel.com)
- MongoDB Atlas account (free at https://www.mongodb.com/cloud/atlas)
- GitHub account (already have this!)

---

## Step 1: Set Up MongoDB Atlas

### 1.1 Create a MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click **"Create a new project"** → Name it (e.g., "FreddyChatroom")
4. Click **"Create a Cluster"**
5. Select **"M0 FREE"** tier
6. Choose your preferred region
7. Click **"Create Cluster"** (takes 2-3 minutes)

### 1.2 Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username: `chatroom_user`
5. Set a strong password (save this!)
6. Click **"Add User"**

### 1.3 Whitelist IP Address

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (for development)
4. Add `0.0.0.0/0` to allow all IPs
5. Click **"Confirm"**

### 1.4 Get Connection String

1. Go to **"Clusters"** → Click **"Connect"**
2. Select **"Connect your application"**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://chatroom_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your database user password
5. **Save this** - you'll need it soon!

---

## Step 2: Prepare Backend for Vercel

### 2.1 Create Vercel API Route Structure

Move your Socket.IO server to Vercel Functions:

```bash
cd backend
mkdir -p api
```

### 2.2 Create API Route Handler

```typescript
// backend/api/socket.js
import { Server } from "socket.io";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const messageSchema = new mongoose.Schema({
  id: { type: String, default: () => uuidv4() },
  userId: String,
  username: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
  isSystemMessage: { type: Boolean, default: false },
});

const Message = mongoose.model("Message", messageSchema);
let io;

export default function handler(req, res) {
  if (!process.env.SOCKET_URL) {
    throw new Error("SOCKET_URL environment variable not set");
  }

  if (res.socket.server.io) {
    console.log("Socket.io already running");
    res.end();
    return;
  }

  const activeUsers = new Map();

  io = new Server(res.socket.server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const userId = uuidv4();
    const username = generateAnonymousUsername();

    activeUsers.set(socket.id, { userId, username, socketId: socket.id });

    io.emit("user_count", activeUsers.size);
    Message.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .then((messages) => {
        socket.emit("message_history", messages.reverse());
      });

    io.emit("user_joined", {
      username,
      count: activeUsers.size,
    });

    socket.on("send_message", async (data) => {
      const userInfo = activeUsers.get(socket.id);
      if (!userInfo) return;

      const messageDoc = new Message({
        userId: userInfo.userId,
        username: userInfo.username,
        content: data.content,
      });

      await messageDoc.save();

      io.emit("receive_message", {
        id: messageDoc.id,
        userId: userInfo.userId,
        username: userInfo.username,
        content: data.content,
        timestamp: messageDoc.timestamp,
      });
    });

    socket.on("delete_message", async (messageId) => {
      await Message.deleteOne({ id: messageId });
      io.emit("message_deleted", messageId);
    });

    socket.on("disconnect", () => {
      const userInfo = activeUsers.get(socket.id);
      activeUsers.delete(socket.id);
      io.emit("user_left", {
        username: userInfo?.username,
        count: activeUsers.size,
      });
    });
  });

  res.socket.server.io = io;
  res.end();
}

function generateAnonymousUsername() {
  const adjectives = ["Happy", "Clever", "Swift", "Mighty", "Curious", "Bright", "Bold", "Calm"];
  const animals = ["Panda", "Eagle", "Wolf", "Tiger", "Phoenix", "Dragon", "Lion", "Falcon"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${animal}${num}`;
}
```

### 2.3 Create vercel.json Config

```json
// backend/vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/socket.js"
    }
  ],
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "NODE_ENV": "production"
  }
}
```

### 2.4 Update Backend package.json

```json
{
  "name": "chatroom-backend",
  "version": "1.0.0",
  "description": "Anonymous chatroom backend",
  "main": "api/socket.js",
  "scripts": {
    "start": "node api/socket.js",
    "dev": "nodemon api/socket.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.5.4",
    "mongoose": "^7.0.3",
    "cors": "^2.8.5",
    "uuid": "^9.0.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

---

## Step 3: Update Frontend for Vercel

### 3.1 Update ChatRoom.tsx

```typescript
// frontend/src/components/ChatRoom.tsx
import React, { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  isSystemMessage?: boolean;
}

export default function ChatRoom() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get backend URL from environment
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    const newSocket = io(backendUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');
    });

    newSocket.on('user_joined', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          userId: 'system',
          username: 'System',
          content: `${data.username} joined the chat`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true,
        },
      ]);
      setUserCount(data.count);
    });

    newSocket.on('message_history', (history) => {
      setMessages(history);
    });

    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('user_count', (count) => {
      setUserCount(count);
    });

    newSocket.on('user_left', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          userId: 'system',
          username: 'System',
          content: `${data.username} left the chat`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true,
        },
      ]);
      setUserCount(data.count);
    });

    newSocket.on('message_deleted', (messageId) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSendMessage = (content: string) => {
    if (socket && content.trim()) {
      socket.emit('send_message', { content });
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (socket) {
      socket.emit('delete_message', messageId);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎉 FreddyChatroom</h1>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </div>
            <div className="px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-200">
              👥 {userCount} online
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
        <MessageList messages={messages} onDeleteMessage={handleDeleteMessage} />
        <MessageInput onSendMessage={handleSendMessage} isConnected={isConnected} />
      </div>
    </div>
  );
}
```

### 3.2 Create .env.local for Frontend

```
# frontend/.env.local
REACT_APP_API_URL=http://localhost:5000
```

### 3.3 Create .env.production for Frontend

```
# frontend/.env.production
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

---

## Step 4: Deploy Backend to Vercel

### 4.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 4.2 Deploy Backend

```bash
cd backend
vercel
```

Follow the prompts:
- **Project name**: `freddy-chatroom-backend`
- **Framework**: Select "Other"
- **Root directory**: `.` (current)

### 4.3 Add Environment Variables

1. After deployment, go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your backend project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
MONGODB_URI=mongodb+srv://chatroom_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/chatroom?retryWrites=true&w=majority
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

5. **Redeploy** after adding variables (Settings → Deployments → Redeploy)

### 4.4 Get Your Backend URL

After deployment, you'll have a URL like:
```
https://freddy-chatroom-backend.vercel.app
```

Save this!

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Update Frontend package.json

```json
{
  "name": "chatroom-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "socket.io-client": "^4.5.4",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
```

### 5.2 Create vercel.json for Frontend

```json
// frontend/vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    {
      "src": "/[^.]+$",
      "destination": "/index.html"
    }
  ]
}
```

### 5.3 Deploy Frontend

```bash
cd frontend
vercel env add REACT_APP_API_URL
# Enter: https://freddy-chatroom-backend.vercel.app
vercel
```

Follow the prompts:
- **Project name**: `freddy-chatroom-frontend`
- **Framework**: Select "Create React App"
- **Root directory**: `.`

---

## Step 6: Connect Frontend to Backend

### 6.1 Update Frontend Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. Update `REACT_APP_API_URL`:
   ```
   https://freddy-chatroom-backend.vercel.app
   ```

### 6.2 Redeploy Frontend

1. Go to **Deployments**
2. Click the latest deployment
3. Click **Redeploy**

---

## Step 7: Verify Deployment

### 7.1 Test Backend

Visit your backend URL:
```
https://freddy-chatroom-backend.vercel.app/api/socket
```

Should show a Socket.IO connection.

### 7.2 Test Frontend

Visit your frontend URL:
```
https://freddy-chatroom-frontend.vercel.app
```

You should see:
- ✅ Connection status (should say "Connected")
- ✅ User count
- ✅ Message input
- ✅ Real-time chat

---

## Troubleshooting

### Connection Refused

**Problem**: Frontend can't connect to backend

**Solution**:
1. Check backend URL in frontend `.env`
2. Verify MongoDB connection string
3. Check browser console for CORS errors
4. Redeploy both frontend and backend

### MongoDB Connection Error

**Problem**: `Error: connect ECONNREFUSED`

**Solution**:
1. Verify MongoDB URI in Vercel environment variables
2. Check IP whitelist allows all IPs (`0.0.0.0/0`)
3. Verify password doesn't have special characters (URL encode if needed)

### WebSocket Connection Fails

**Problem**: `WebSocket is closed before the connection is established`

**Solution**:
1. Ensure Socket.IO is properly configured
2. Check CORS settings in backend
3. Verify both URLs are HTTPS (Vercel uses HTTPS)

### Messages Not Persisting

**Problem**: Messages disappear on refresh

**Solution**:
1. Verify MongoDB connection is working
2. Check Messages collection exists in Atlas
3. Review backend logs in Vercel dashboard

---

## Monitoring & Logs

### Backend Logs

1. Go to Vercel Dashboard → Select backend project
2. Go to **Deployments** → Select latest
3. Click **Runtime Logs** to see errors in real-time

### Frontend Logs

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Check for errors/warnings

---

## Cost Overview

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel Frontend | ✅ Unlimited | Free |
| Vercel Backend | ✅ 100GB bandwidth | Free |
| MongoDB Atlas | ✅ 512MB storage | Free |
| **Total** | **✅ Fully Free** | **$0** |

---

## Next Steps

✅ Your chatroom is live!

Optional enhancements:
- Add custom domain
- Enable automatic deployments from GitHub
- Set up analytics
- Add more features (typing indicators, reactions, etc.)

---

## Quick Reference

**Backend Deploy Command:**
```bash
cd backend && vercel
```

**Frontend Deploy Command:**
```bash
cd frontend && vercel
```

**Environment Variables Needed:**
- Backend: `MONGODB_URI`, `FRONTEND_URL`
- Frontend: `REACT_APP_API_URL`

**Your URLs (replace with actual):**
- Frontend: `https://freddy-chatroom-frontend.vercel.app`
- Backend: `https://freddy-chatroom-backend.vercel.app`
- MongoDB Atlas: Your connection string

---

**Need help? Check Vercel docs at https://vercel.com/docs**
