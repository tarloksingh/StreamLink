# Signaling Server Setup Guide

## What is the Signaling Server?

The signaling server is a WebSocket server that helps your iPhone and MacBook find each other and establish a direct WebRTC connection for video streaming.

Think of it like a matchmaker:
- iPhone says: "I'm streaming! Here's my connection info"
- Server tells MacBook: "Hey, iPhone wants to stream to you, here's how to connect"
- They connect directly and video flows iPhone → MacBook

## Quick Start (Local Testing)

### 1. Start the Signaling Server

```bash
npm run signaling
```

You should see:
```
🚀 StreamLink Signaling Server
================================
✅ Server listening on port 3001
🌐 WebSocket URL: ws://localhost:3001
```

### 2. Test It

**On iPhone (same WiFi):**
1. Find your computer's local IP: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
2. Open Safari: `http://YOUR_IP:5173` (or wherever your dev server is)
3. Make sure the app connects to `ws://YOUR_IP:3001`

**On MacBook:**
1. Open `http://localhost:5173`
2. Should see streams from iPhone!

## Deployment Options

### Option 1: Railway (Easiest, Free Tier)

1. **Sign up**: https://railway.app/
2. **Create new project** → Deploy from GitHub
3. **Select your repo**: `StreamLink`
4. **Settings**:
   - Start Command: `node signaling-server.js`
   - Add environment variable: `PORT=3001` (Railway auto-assigns)
5. **Deploy**: Railway gives you a URL like `streamlink-production.up.railway.app`

**Update your app:**
```typescript
// In client code
const SIGNALING_URL = 'wss://streamlink-production.up.railway.app';
```

### Option 2: Render (Also Free)

1. **Sign up**: https://render.com/
2. **New Web Service** → Connect GitHub
3. **Settings**:
   - Build Command: `npm install`
   - Start Command: `node signaling-server.js`
4. **Environment**: Node
5. **Deploy**: Get URL like `streamlink.onrender.com`

### Option 3: Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create app
heroku create streamlink-signaling

# Deploy
git push heroku main

# Your URL: streamlink-signaling.herokuapp.com
```

### Option 4: Your Own Server (VPS)

**Requirements:**
- Ubuntu/Debian server
- Node.js 18+
- PM2 for process management

```bash
# On your server
git clone https://github.com/YOUR_USERNAME/StreamLink.git
cd StreamLink
npm install
npm install -g pm2

# Start server
pm2 start signaling-server.js --name streamlink-signaling
pm2 save
pm2 startup

# Your server IP: your-server-ip.com:3001
```

## Environment Variables

Create `.env` file:
```
PORT=3001
NODE_ENV=production
```

## Updating Your App

Once deployed, update the signaling URL in your app:

**Option 1: Environment Variable (Recommended)**
```typescript
// vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.VITE_SIGNALING_URL': JSON.stringify(
      process.env.VITE_SIGNALING_URL || 'ws://localhost:3001'
    )
  }
});

// In your app
const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL;
```

**Option 2: Hardcode (For Testing)**
```typescript
// client/src/lib/signaling.ts
const SIGNALING_URL = 'wss://your-server.railway.app';
```

## Testing the Setup

### 1. Check Server is Running
```bash
curl http://your-server-url.com
# Should see: "StreamLink Signaling Server Running"
```

### 2. Test WebSocket Connection
Open browser console:
```javascript
const ws = new WebSocket('wss://your-server-url.com');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

### 3. Full Flow Test
1. iPhone: Start streaming
2. Check server logs: Should see "Broadcaster registered"
3. MacBook: Open stream
4. Check server logs: Should see "Viewer joined"
5. MacBook: Should see video!

## Troubleshooting

### "WebSocket connection failed"
- Check firewall allows port 3001
- Make sure URL uses `wss://` (secure) not `ws://` on HTTPS sites
- Verify server is running: `curl http://server-url.com`

### "Stream not found"
- iPhone and MacBook must connect to SAME server
- Check they're using same signaling URL
- Check server logs for "Broadcaster registered"

### "Cannot connect devices"
- Make sure both devices on same network (or server is public)
- Check console for WebRTC errors
- May need TURN server for restrictive networks

## Monitoring

### View Server Logs

**Railway/Render:**
- View in dashboard

**Heroku:**
```bash
heroku logs --tail --app streamlink-signaling
```

**PM2:**
```bash
pm2 logs streamlink-signaling
```

### What to Look For
- "Broadcaster registered" - Stream started
- "Viewer joined" - Someone watching
- "Forwarded offer/answer" - Connection being established
- "Broadcaster disconnected" - Stream ended

## Cost Estimates

| Service | Free Tier | Paid |
|---------|-----------|------|
| Railway | 500 hrs/month | $5/month |
| Render | 750 hrs/month | $7/month |
| Heroku | 550 hrs/month | $7/month |
| DigitalOcean | N/A | $5/month |

**Recommendation**: Start with Railway or Render free tier for testing.

## Security (Production)

Add to `signaling-server.js`:

```javascript
// Add authentication
const VALID_API_KEY = process.env.API_KEY;

wss.on('connection', (ws, req) => {
  const apiKey = new URL(req.url, 'ws://localhost').searchParams.get('key');
  
  if (apiKey !== VALID_API_KEY) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  
  // ... rest of code
});
```

## Next Steps

After deploying the signaling server:

1. ✅ Deploy signaling server
2. ✅ Get server URL
3. ✅ Update app with server URL
4. ✅ Test iPhone → MacBook streaming
5. 🎯 **AirPlay will still mirror** (need HLS for true AirPlay)

For proper AirPlay (no mirroring), you'd need to add:
- Media server to convert stream to HLS
- More complex but solves the mirroring issue

Want help with that next?

