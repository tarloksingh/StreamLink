# 🚀 Deploy to Production (5 minutes)

## Step 1: Deploy Signaling Server to Render.com (2 mins)

### 1.1 Sign Up
1. Go to: https://render.com/
2. Click "Get Started" (free, no credit card needed)
3. Sign in with GitHub

### 1.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub account if not already connected
3. Select the `StreamLink` repository
4. Fill in:
   - **Name**: `streamlink-signaling`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node signaling-server.js`
   - **Instance Type**: Free
5. Click "Create Web Service"

### 1.3 Get Your URL
After deployment completes (~2 mins), you'll get a URL like:
```
https://streamlink-signaling.onrender.com
```
**Copy this URL!**

---

## Step 2: Update Signaling URL in Code (30 seconds)

Update `client/src/lib/config.ts`:

```typescript
export const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'wss://streamlink-signaling.onrender.com';
```

**Important**: Use `wss://` (not `ws://`) for secure WebSocket over HTTPS!

---

## Step 3: Deploy to GitHub Pages (1 min)

```bash
# Commit the changes
git add .
git commit -m "Add production signaling server URL"
git push origin main
```

GitHub Actions will automatically deploy to:
```
https://tarloksingh.github.io/StreamLink/
```

Wait ~2 minutes for GitHub Actions to complete.

---

## Step 4: Test! (30 seconds)

### On iPhone:
1. Go to: `https://tarloksingh.github.io/StreamLink/`
2. Tap "Start Live"
3. Grant camera permission
4. ✅ Your video should show!

### On Mac:
1. Go to: `https://tarloksingh.github.io/StreamLink/`
2. ✅ You should see the iPhone's stream in the list!
3. Click it to watch

---

## Why This Works:

✅ **Frontend**: GitHub Pages (free HTTPS)  
✅ **Signaling Server**: Render.com (free HTTPS)  
✅ **WebRTC**: Peer-to-peer with TURN fallback  
✅ **Permanent URLs**: No more changing tunnel URLs!

---

## Need Help?

If Render.com deployment fails, try these alternatives:
- **Railway.app** (also free): https://railway.app/
- **Fly.io** (also free): https://fly.io/

All work the same way - just deploy the signaling server and update the URL in config.ts!

---

## ⚠️ Render.com Free Tier Note:

The free tier "spins down" after 15 minutes of inactivity. First connection might take ~30 seconds to wake up. For production, upgrade to paid tier ($7/month) for always-on service.

