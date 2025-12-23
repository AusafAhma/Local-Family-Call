# Family Video Call Application

A simple Google Meet-like video calling web application for family use, supporting up to 10 participants with WebRTC and Socket.IO.

## Features

- ✅ **Real-time video and audio calling** (no screen sharing or recording)
- ✅ **Maximum 10 participants** with automatic room full detection
- ✅ **Permanent meeting link** - same room every time
- ✅ **No authentication** required - join by link only
- ✅ **Auto-host assignment** - first person becomes the host
- ✅ **Premium dark UI** with glassmorphism effects
- ✅ **Responsive design** - works on desktop and mobile browsers
- ✅ **Built with Next.js** and deployable on Vercel

## Tech Stack

- **Frontend**: Next.js (React), Socket.IO Client
- **Backend**: Socket.IO Server (Next.js API)
- **WebRTC**: Mesh architecture with STUN servers
- **Styling**: Vanilla CSS with modern design patterns
- **Deployment**: Vercel (fully serverless)

## Project Structure

```
family-video-call/
├── pages/
│   ├── index.js          # Join page with username input
│   ├── room.js           # Video call room with WebRTC
│   ├── _app.js           # Next.js App wrapper
│   └── api/              # API routes (not used in custom server mode)
├── lib/
│   └── webrtc.js         # WebRTC helper utilities
├── styles/
│   └── globals.css       # Global styles
├── server.js             # Custom Socket.IO server
├── package.json
└── next.config.mjs
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone or navigate to the project directory
cd family-video-call

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Testing Locally

1. Open `http://localhost:3000` in your browser
2. Enter your name and click "Join Call"
3. Allow camera/microphone permissions
4. Open the same URL in another tab or browser to test with multiple participants

**Note**: To test with 10+ users, open 11 browser tabs - the 11th should show "Room Full"

## Deployment to Vercel

### Important Note About Socket.IO on Vercel

Vercel's serverless architecture **does not support persistent WebSocket connections** needed for Socket.IO in production. The custom server setup (`server.js`) works only for local development.

### Recommended Deployment Approaches

#### Option 1: Deploy to Vercel (Frontend) + Separate WebSocket Server

**Best for production use**

1. **Deploy static frontend to Vercel**:
   - Remove Socket.IO dependency
   - Use a separate WebSocket service (e.g., Railway, Render, Fly.io)
   - Update Socket.IO connection URL in `pages/room.js`

2. **Deploy WebSocket server separately**:

   ```bash
   # Create a separate Node.js app with just server.js
   # Deploy to Railway/Render/Fly.io
   ```

#### Option 2: Full Stack Deployment (Railway/Render)

**Simpler but requires a separate hosting service**

1. Create `package.json` scripts:

   ```json
   {
     "scripts": {
       "build": "next build",
       "start": "NODE_ENV=production node server.js"
     }
   }
   ```

2. Deploy entire app to Railway or Render:
   - These platforms support WebSocket connections
   - Use the `start` command for production

#### Option 3: Alternative Architecture (Vercel-Compatible)

**For Vercel-only deployment, you would need to**:

1. Replace Socket.IO with Vercel-compatible WebSocket solution (e.g., Pusher, Ably)
2. Or use Vercel's Edge Functions with WebSocket support (experimental)
3. Or implement a polling-based signaling mechanism (not recommended)

### Quick Deploy to Railway (Recommended for Full Features)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize new project
railway init

# Deploy
railway up
```

Railway will automatically detect Next.js and run `npm start`.

### Environment Setup

No environment variables are required. STUN servers are public and hardcoded.

## How It Works

### Architecture

```
User A Browser  ←→  WebRTC Peer Connection  ←→  User B Browser
       ↓                                              ↓
   Socket.IO                                     Socket.IO
       ↓                                              ↓
       └──────→  Signaling Server (Node.js)  ←───────┘
```

### Signaling Flow

1. **User joins**: Browser connects via Socket.IO
2. **Server checks**: Room size < 10?
3. **If yes**: Assign host (if first), broadcast to existing users
4. **If no**: Send "room-full" error
5. **WebRTC negotiation**: Peers exchange offers/answers/ICE candidates via Socket.IO
6. **Direct connection**: WebRTC establishes peer-to-peer media streams

### Mesh vs SFU

This app uses **mesh architecture** where each user connects directly to every other user:

- ✅ Low latency (direct connections)
- ✅ No media server costs
- ✅ Simple implementation
- ⚠️ Limited to ~10 users (bandwidth constraints)

For >10 users, you'd need an **SFU (Selective Forwarding Unit)** like Janus or mediasoup.

## Browser Compatibility

### Desktop

- ✅ Chrome 74+
- ✅ Firefox 66+
- ✅ Edge 79+
- ✅ Safari 12.1+

### Mobile

- ✅ Chrome Android 74+
- ✅ Safari iOS 12.2+

**HTTPS Required**: Modern browsers require HTTPS for `getUserMedia()` (camera/microphone access). Localhost is exempt.

## Troubleshooting

### "Room Full" even with <10 users

- Check server console for connected users count
- Refresh the page or clear browser cache

### Camera/microphone not working

- Verify browser permissions
- HTTPS required (except localhost)
- Check if another app is using the camera

### WebRTC connection fails

- Firewall blocking UDP ports
- Consider adding TURN servers for restrictive networks
- Check browser console for errors

### Deployment: "WebSocket connection failed"

- Vercel doesn't support persistent WebSockets
- Use Railway/Render for Socket.IO
- Or implement alternative signaling (Pusher/Ably)

## Customization

### Change Room Limit

Edit `server.js`:

```javascript
const room = {
  users: new Map(),
  maxUsers: 20  // Change from 10 to your desired limit
};
```

Note: Mesh architecture bandwidth increases with N²

### Add TURN Servers (for firewalls)

Edit `lib/webrtc.js`:

```javascript
export const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:your-turn-server.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
};
```

Free TURN options: Twilio, xirsys (free tier)

### Customize UI Colors

Edit `styles/globals.css`:

```css
:root {
  --primary: #667eea;      /* Primary color */
  --secondary: #764ba2;    /* Secondary color */
  --bg-dark: #0f0f1e;      /* Background color */
}
```

## Security Considerations

### Production Checklist

- [ ] Use HTTPS (required for WebRTC)
- [ ] Implement rate limiting on Socket.IO connections
- [ ] Add CORS restrictions in production
- [ ] Consider room passwords for privacy
- [ ] Add user authentication if needed
- [ ] Use TURN servers with authentication

### Current Security

- ✅ No data persistence (no database)
- ✅ Peer-to-peer media (no server recording)
- ⚠️ No authentication (anyone with link can join)
- ⚠️ No encryption (use HTTPS for transport encryption)

## License

MIT License - Free to use for personal and commercial projects

## Support

For issues or questions, check:

- Browser console for WebRTC errors
- Server terminal for Socket.IO logs
- Network tab for connection issues

---

**Built with ❤️ for families to stay connected**
