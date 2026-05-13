# FreddyChatroom - Anonymous Chatroom Website

A modern, real-time chatroom application with message persistence and anonymous users.

## Features

✨ **Anonymous Users** - Generate unique usernames automatically
💬 **Real-time Messaging** - Instant message delivery with Socket.IO
💾 **Message Persistence** - All messages stored in MongoDB
👥 **User Presence** - See who's online in real-time
🎨 **Modern UI** - Built with React and Tailwind CSS
🔒 **Clean Design** - Dark theme with great UX

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Database**: MongoDB
- **Real-time**: Socket.IO

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB running locally or cloud instance
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB URI
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000 npm start
```

Frontend runs on `http://localhost:3000`

## Environment Variables

**Backend** (`.env`):
```
MONGODB_URI=mongodb://localhost:27017/chatroom
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

**Frontend** (`.env.local`):
```
REACT_APP_API_URL=http://localhost:5000
```

## Project Structure

```
FreddyChatroom/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
���── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatRoom.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── MessageInput.tsx
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Features Explained

### Anonymous User Generation
- Users are assigned unique usernames (e.g., `BrightEagle42`)
- Each user gets a unique UUID
- No authentication required

### Message Persistence
- All messages stored in MongoDB
- Message history loaded on connection
- Last 50 messages shown by default
- Delete functionality available

### Real-time Events
- `send_message` - User sends a message
- `receive_message` - Message received by all users
- `user_joined` - New user joins
- `user_left` - User disconnects
- `message_deleted` - Message removed
- `user_count` - Updated user count

## Future Enhancements

- [ ] Message reactions/emojis
- [ ] User typing indicators
- [ ] Message editing
- [ ] Room/channel support
- [ ] Message search
- [ ] Rate limiting
- [ ] Content moderation

## License

MIT