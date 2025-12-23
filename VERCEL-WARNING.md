# ⚠️ IMPORTANT: Vercel Deployment Limitation

## Critical Issue

**This application WILL NOT work correctly when deployed to Vercel** because:

### The Problem

- This app uses **Socket.IO** for WebRTC signaling
- Socket.IO requires **persistent WebSocket connections**
- Vercel uses **serverless functions** that don't support persistent connections
- The `server.js` custom server **cannot run on Vercel**

### What Will Happen on Vercel

✅ **Build**: Will succeed  
✅ **Frontend**: Will load  
❌ **Video calls**: Will NOT work (signaling fails)  

## ✅ Solution: Use Railway or Render

### Recommended: Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up

# Get your URL
railway domain
```

**Railway supports:**

- ✅ WebSocket connections
- ✅ Custom servers
- ✅ Socket.IO
- ✅ $5/month free credit

### Alternative: Render

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Set:
   - Build: `npm install && npm run build`
   - Start: `npm start`

## 🔧 To Deploy on Vercel (Advanced)

You would need to:

1. **Split the application:**
   - Frontend → Vercel
   - Backend (server.js) → Railway/Render

2. **Update Socket.IO connection:**

   ```javascript
   // In pages/room.js, change:
   socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL);
   ```

3. **Add environment variable on Vercel:**

   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```

See `DEPLOYMENT.md` for detailed hybrid deployment instructions.

## 📌 Current Status

✅ Fixed: Next.js security vulnerability (CVE-2025-66478)  
✅ Fixed: React version conflicts  
✅ Fixed: Next.js config warnings  
❌ **Vercel deployment will build but won't function**

## 🚀 Next Steps

1. **Cancel Vercel deployment** (if it hasn't finished)
2. **Deploy to Railway** (recommended)
3. **OR** implement hybrid Vercel + Railway setup

---

**For working video calls, use Railway or Render!**
