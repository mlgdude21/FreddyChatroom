# Render Deployment Guide for FreddyChatroom

Complete step-by-step guide to deploy your chatroom to Render.com with MongoDB Atlas.

## Prerequisites

- Render.com account (free at https://render.com)
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
3. Select **"Allow Access from Anywhere"**
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

## Step 2: Deploy Backend to Render

### 2.1 Connect GitHub to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Select **"Connect a repository"**
4. Authorize Render to access your GitHub
5. Search for and select **"FreddyChatroom"**

### 2.2 Configure Backend Service

1. **Name**: `freddy-chatroom-backend`
2. **Environment**: Select **"Node"**
3. **Build Command**: `cd backend && npm install`
4. **Start Command**: `cd backend && npm start`
5. **Instance Type**: Select **"Free"** tier

### 2.3 Add Environment Variables

Before deploying, click **"Advanced"** and add environment variables:

```
MONGODB_URI=mongodb+srv://chatroom_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/chatroom?retryWrites=true&w=majority
FRONTEND_URL=https://freddy-chatroom-frontend.onrender.com
NODE_ENV=production
PORT=10000
```

Replace:
- `YOUR_PASSWORD` with your MongoDB user password
- `freddy-chatroom-frontend.onrender.com` with your actual frontend URL (you'll get this after deploying frontend)

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. You'll see a URL like: `https://freddy-chatroom-backend.onrender.com`
4. **Save this URL** - you'll need it for the frontend

### 2.5 Monitor Deployment

- Go to **"Logs"** tab to see deployment progress
- Should show: `Server running on port 10000`

---

## Step 3: Deploy Frontend to Render

### 3.1 Create Frontend Service

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Select **"Connect a repository"**
3. Search for **"FreddyChatroom"**
4. Click **"Connect"**

### 3.2 Configure Frontend Service

1. **Name**: `freddy-chatroom-frontend`
2. **Build Command**: `cd frontend && npm install && npm run build`
3. **Publish Directory**: `frontend/build`
4. **Instance Type**: Select **"Free"**

### 3.3 Add Environment Variables

Click **"Advanced"** and add:

```
REACT_APP_API_URL=https://freddy-chatroom-backend.onrender.com
```

(Use the backend URL you got from Step 2.4)

### 3.4 Deploy

1. Click **"Create Static Site"**
2. Wait 2-3 minutes for build and deployment
3. You'll get a URL like: `https://freddy-chatroom-frontend.onrender.com`

---

## Step 4: Update Backend with Correct Frontend URL

Now that you have your frontend URL, update the backend environment variables:

1. Go to Render Dashboard → **freddy-chatroom-backend**
2. Click **"Settings"**
3. Go to **"Environment"**
4. Update `FRONTEND_URL` to your actual frontend URL
5. Click **"Save"**
6. The service will auto-redeploy with the correct URL

---

## Step 5: Verify Everything Works

### 5.1 Test Frontend Connection

1. Visit your frontend URL: `https://freddy-chatroom-frontend.onrender.com`
2. Check if it says **"Connected"** (green indicator)
3. Try sending a message
4. Refresh the page - message should still be there!

### 5.2 Check Backend Logs

1. Render Dashboard → **freddy-chatroom-backend**
2. Go to **"Logs"** tab
3. Should show Socket.IO connections from your frontend

### 5.3 Open Browser Console

1. Visit frontend URL
2. Open DevTools (F12)
3. **Console** tab - should NOT show errors
4. **Network** tab - check WebSocket connection (wss protocol)

---

## Troubleshooting

### ❌ Frontend Shows "Disconnected"

**Issue**: Frontend can't connect to backend

**Fix**:
1. Check `REACT_APP_API_URL` in frontend environment variables
2. Verify it matches your backend URL exactly
3. Check backend logs for errors
4. Redeploy frontend after updating variables

### ❌ Backend Deployment Fails

**Issue**: `Build failed` or error in logs

**Fix**:
1. Check logs tab for specific error
2. Verify `package.json` is in backend folder
3. Check MongoDB connection string (no typos)
4. Ensure all dependencies are listed in `package.json`

### ❌ Messages Don't Save

**Issue**: Messages disappear after refresh

**Fix**:
1. Verify MongoDB connection string is correct
2. Check IP whitelist in MongoDB Atlas includes `0.0.0.0/0`
3. Test MongoDB connection in backend logs
4. Check database name matches in connection string

### ❌ WebSocket Connection Fails

**Issue**: "WebSocket is closed" error

**Fix**:
- Ensure backend URL uses `https://` (not http)
- Verify Socket.IO is properly configured in backend
- Check CORS settings
- Redeploy both services

### ❌ "Too many open connections" Error

**Issue**: MongoDB connection pool exhausted

**Fix**:
1. Check how many connections are open
2. Verify connection string uses `?maxPoolSize=5`
3. Redeploy backend

---

## Cost Analysis

| Service | Free Tier | Monthly Cost |
|---------|-----------|--------------|
| Render Frontend | ✅ 100GB bandwidth | $0 |
| Render Backend | ✅ 750 hrs/month | $0 |
| MongoDB Atlas | ✅ 512MB storage | $0 |
| **Total** | **✅ Completely Free** | **$0** |

**Note**: Services may sleep after 15 minutes of inactivity (free tier limitation). They wake up when accessed.

---

## Your Live URLs

**Frontend**: https://freddy-chatroom-frontend.onrender.com

**Backend**: https://freddy-chatroom-backend.onrender.com

**Share with friends!** 🎉

---

## Important Notes

### Free Tier Limitations

1. **Services sleep after 15 min of inactivity** - First request takes 30 seconds to wake up
2. **750 hours per month** - Enough for small projects (750 ÷ 24 ÷ 30 = ~1 service always on)
3. **Bandwidth**: 100GB/month per service

### To Keep Services Always On

If you want services to never sleep:
- Upgrade to paid plan ($12/month for backend)
- Or set up a ping service to keep them awake

---

## Deployment Checklist

- [ ] MongoDB Atlas account created
- [ ] MongoDB user and cluster set up
- [ ] Connection string saved
- [ ] GitHub account connected to Render
- [ ] Backend deployed to Render
- [ ] Backend logs show no errors
- [ ] Frontend deployed to Render
- [ ] Frontend shows "Connected"
- [ ] Send a test message
- [ ] Refresh page - message persists ✅

---

## What's Deployed

✅ **Frontend**
- React + TypeScript + Tailwind CSS
- Real-time UI updates
- Hosted on Render CDN

✅ **Backend**
- Express + Socket.IO server
- Real-time messaging
- Serverless on Render

✅ **Database**
- MongoDB Atlas (cloud-hosted)
- Auto-scaling
- Free 512MB storage

---

## Next Steps

### Optional Enhancements

- [ ] Add custom domain ($10/month on Render)
- [ ] Set up GitHub auto-deploy (already configured!)
- [ ] Upgrade to paid plan to prevent sleep
- [ ] Add message reactions
- [ ] Add typing indicators
- [ ] Implement user rate limiting

### GitHub Auto-Deploy

Your services will **automatically redeploy** whenever you push to GitHub!

1. Make changes to code
2. `git push` to GitHub
3. Render auto-deploys both services
4. Changes live in 2-5 minutes

### Custom Domain

1. Render Dashboard → Project Settings
2. **Custom Domain** → Add your domain
3. Follow DNS setup instructions

---

## Quick Reference

**View Backend Logs:**
- Render Dashboard → Backend Project → Logs tab

**View Frontend Logs:**
- Render Dashboard → Frontend Project → Logs tab

**Redeploy Service:**
- Render Dashboard → Project → Manual Deploy → Deploy latest commit

**Update Environment Variables:**
- Render Dashboard → Project → Environment tab → Edit

**MongoDB Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

---

## Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Guide](https://docs.mongodb.com/atlas/)
- [Socket.IO Deployment Guide](https://socket.io/docs/v4/)
- [Express.js Guide](https://expressjs.com/)

---

## Common Questions

**Q: Why does it take 30 seconds to load on first visit?**
A: Free tier services sleep after 15 minutes of inactivity. First request wakes them up.

**Q: How do I prevent sleeping?**
A: Upgrade to paid plan ($12/month) or use a pinging service.

**Q: Can I use a custom domain?**
A: Yes, but costs $10/month. Free domains end in `.onrender.com`.

**Q: How do I see what's going wrong?**
A: Check the Logs tab in your project dashboard.

**Q: Can I increase MongoDB storage?**
A: Yes, upgrade MongoDB Atlas to a paid plan ($0.10/GB).

---

**Deployed successfully?** Great! Your chatroom is now live on Render! 🚀

Share your URL with friends and start chatting! 💬
