# Deployment Guide - Family Video Call

This guide provides detailed instructions for deploying the Family Video Call application to production.

## ⚠️ Critical: Socket.IO and Vercel Limitations

**The current application uses a custom Socket.IO server which is NOT compatible with Vercel's serverless architecture.**

Vercel's serverless functions don't support persistent WebSocket connections required by Socket.IO. You have three options:

---

## Option 1: Deploy to Railway (Recommended)

Railway supports persistent WebSocket connections and is the easiest deployment option.

### Step 1: Prepare Your Code

Ensure `package.json` has the correct start script:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

### Step 2: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 3: Deploy via CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Step 4: Configure Domain

1. Go to Railway dashboard
2. Click on your project
3. Go to "Settings" → "Domains"
4. Click "Generate Domain" or add custom domain

Your app will be live at `https://your-project.railway.app`

### Railway Pricing

- Free tier: 500 hours/month (~$5 credit)
- Ideal for family use (low traffic)

---

## Option 2: Deploy to Render

Render also supports WebSocket connections with a generous free tier.

### Step 1: Create Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: family-video-call
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Deploy

Render will automatically:

- Build your app
- Start the server
- Provide a URL

Your app will be live at `https://your-app.onrender.com`

### Render Pricing

- Free tier: Available with some limitations
- Spins down after inactivity (may take 30s to wake up)

---

## Option 3: Hybrid Deployment (Vercel Frontend + Railway/Render Backend)

Split your application: static frontend on Vercel, WebSocket server elsewhere.

### Step 1: Modify Architecture

**A. Create separate backend repo**

1. Create new directory `family-video-call-backend`:

   ```bash
   mkdir family-video-call-backend
   cd family-video-call-backend
   ```

2. Copy these files:

   ```
   family-video-call-backend/
   ├── server.js
   └── package.json
   ```

3. Update `package.json`:

   ```json
   {
     "name": "family-video-call-backend",
     "version": "1.0.0",
     "scripts": {
       "start": "node server.js"
     },
     "dependencies": {
       "socket.io": "^4.8.1"
     }
   }
   ```

4. Modify `server.js` to remove Next.js dependencies:

   ```javascript
   const { createServer } = require('http');
   const { Server } = require('socket.io');
   
   const port = process.env.PORT || 3001;
   
   const httpServer = createServer((req, res) => {
     res.writeHead(200);
     res.end('Socket.IO server running');
   });
   
   const io = new Server(httpServer, {
     cors: {
       origin: '*', // In production, set to your Vercel domain
       methods: ['GET', 'POST']
     }
   });
   
   // ... rest of Socket.IO logic from original server.js
   ```

5. Deploy backend to Railway/Render (see options above)

**B. Update Frontend for Vercel**

1. In `pages/room.js`, change Socket.IO connection:

   ```javascript
   // Replace
   socketRef.current = io('http://localhost:3000');
   
   // With
   socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
   ```

2. Create `.env.local`:

   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```

3. Update `package.json` - remove custom server:

   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start"
     }
   }
   ```

**C. Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variable in Vercel dashboard
# NEXT_PUBLIC_SOCKET_URL = https://your-backend.railway.app
```

### Hybrid Deployment Pros/Cons

✅ **Pros:**

- Leverage Vercel's CDN for static assets
- Separate scaling for frontend/backend
- Free Vercel tier for frontend

❌ **Cons:**

- More complex setup
- Two separate deployments
- CORS configuration needed

---

## Option 4: Alternative - Use Vercel-Compatible Signaling

Replace Socket.IO with a Vercel-compatible service:

### Using Pusher

1. Sign up at [pusher.com](https://pusher.com)
2. Install Pusher:

   ```bash
   npm install pusher pusher-js
   ```

3. Replace Socket.IO logic with Pusher channels
4. Deploy normally to Vercel

### Using Ably

1. Sign up at [ably.com](https://ably.com)
2. Install Ably:

   ```bash
   npm install ably
   ```

3. Replace Socket.IO with Ably realtime
4. Deploy to Vercel

**Note**: Both Pusher and Ably have free tiers but require code refactoring.

---

## Production Checklist

Before going live:

### Security

- [ ] Enable HTTPS (automatic on Railway/Render/Vercel)
- [ ] Set proper CORS origins (not `*`)
- [ ] Add rate limiting
- [ ] Consider room passwords

### Performance

- [ ] Test with 10 concurrent users
- [ ] Monitor server resources
- [ ] Check bandwidth usage

### Features

- [ ] Test on multiple browsers
- [ ] Verify mobile compatibility
- [ ] Test room full scenario
- [ ] Verify host assignment

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Monitor uptime
- [ ] Track user analytics (optional)

---

## Cost Comparison

| Platform | Free Tier | Paid Start | WebSocket Support | Ease of Use |
|----------|-----------|------------|-------------------|-------------|
| **Railway** | $5 credit/month | $5/month | ✅ Yes | ⭐⭐⭐⭐⭐ |
| **Render** | Free (with limits) | $7/month | ✅ Yes | ⭐⭐⭐⭐⭐ |
| **Vercel** | Free | $20/month | ❌ No* | ⭐⭐⭐⭐ |
| **Fly.io** | Free tier | $3/month | ✅ Yes | ⭐⭐⭐ |
| **Heroku** | No free tier | $7/month | ✅ Yes | ⭐⭐⭐⭐ |

*Vercel requires external WebSocket service

---

## Recommended: Railway Deployment

**For most users, Railway is the best choice:**

1. ✅ Simple one-command deployment
2. ✅ Full WebSocket support
3. ✅ $5/month free credit (enough for family use)
4. ✅ Auto-deploy on git push
5. ✅ Easy custom domains

### Quick Deploy to Railway

```bash
# One-time setup
npm i -g @railway/cli
railway login
railway init

# Deploy
railway up

# Get your URL
railway domain
```

Share the Railway URL with your family!

---

## Troubleshooting Deployment

### Issue: "WebSocket connection failed"

- **Cause**: Deployed to Vercel without modifying architecture
- **Fix**: Use Railway/Render OR implement hybrid deployment

### Issue: "Room full" on fresh deployment

- **Cause**: Server state persisting
- **Fix**: Restart the server

### Issue: Camera doesn't work on deployment

- **Cause**: Not using HTTPS
- **Fix**: All recommended platforms provide HTTPS automatically

### Issue: High bandwidth costs

- **Cause**: Mesh architecture with many users
- **Fix**: Consider switching to SFU architecture for >10 users

---

## Next Steps

1. Choose your deployment platform (Railway recommended)
2. Follow the corresponding guide above
3. Test with family members
4. Share the permanent link
5. Monitor usage and costs

**Need help?** Check the README.md for troubleshooting tips.
