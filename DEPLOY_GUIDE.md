# 🚀 Easy Deployment Guide (5 Minutes)

## The Plan
- **Frontend (React app)**: GitHub Pages (already working) ✅
- **Signaling Server**: Railway.app (free hosting with HTTPS)

---

## Step 1: Deploy Signaling Server to Railway (2 mins)

1. **Go to**: https://railway.app/
2. **Click**: "Start a New Project"
3. **Login**: Use GitHub account (easiest)
4. **Select**: "Deploy from GitHub repo"
5. **Choose**: `StreamLink` repository
6. **Railway will automatically**:
   - Detect it's a Node.js project
   - Run `npm install`
   - Start the signaling server

7. **After deployment**:
   - Railway gives you a URL like: `https://streamlink-production.up.railway.app`
   - Copy this URL

8. **Add Port Config**:
   - In Railway dashboard, go to "Variables"
   - Add: `PORT = 3001`
   - Click "Deploy" to restart

---

## Step 2: Update Client Config (1 min)

Update `client/src/lib/config.ts`:

```typescript
export const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'wss://YOUR-RAILWAY-URL.railway.app';
```

**Note**: Use `wss://` (not `ws://`) for secure WebSocket over HTTPS!

---

## Step 3: Deploy to GitHub Pages (1 min)

```bash
git add .
git commit -m "Add Railway deployment config and update signaling URL"
git push origin main
```

GitHub Actions will automatically build and deploy to:
`https://tarloksingh.github.io/StreamLink/`

---

## Step 4: Test! (1 min)

1. **On iPhone Safari**: `https://tarloksingh.github.io/StreamLink/`
2. **Tap "Start Live"** - Camera should work (HTTPS!)
3. **On Mac**: Same URL - should see the stream!

---

## Alternative: Just Use ngrok for Now (30 seconds)

If you just want to test quickly:

```bash
# Sign up at ngrok.com (free, 30 seconds)
# Copy your authtoken from dashboard
ngrok config add-authtoken YOUR_TOKEN

# Start tunnel
ngrok http 3000

# Use the https://xxx.ngrok-free.app URL on iPhone
```

---

## Which Should You Choose?

**For quick testing today**: Use ngrok (30 second signup)

**For real deployment**: Use Railway + GitHub Pages (5 mins, but permanent URLs)

---

## Need Help?

Tell me which option you want and I'll guide you through it step by step!

