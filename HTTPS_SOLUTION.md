# HTTPS Solution for iOS Camera Access

## The Problem
iOS Safari requires HTTPS (or localhost) to access camera/microphone. The app at `http://192.168.1.74:3000` won't work because it's HTTP.

## Solution: Use ngrok

ngrok creates a secure HTTPS tunnel to your local server.

### Quick Start

**Terminal 1 - Run the servers:**
```bash
# Start signaling server (if not already running)
npm run signaling

# In another terminal tab, start dev server
npm run dev
```

**Terminal 2 - Create HTTPS tunnel:**
```bash
# Tunnel port 3000 with HTTPS
ngrok http 3000
```

After running ngrok, you'll see:
```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000
```

### Update Config

1. Copy the `https://xxxx.ngrok-free.app` URL
2. Open iPhone Safari and go to that HTTPS URL
3. On Mac, also use that HTTPS URL

### Important Notes

- **Free ngrok limitation**: The URL changes every time you restart ngrok
- **Signaling server**: You'll need to update `client/src/lib/config.ts` to use the Mac's local IP for signaling (keep using `ws://192.168.1.74:3001` since signaling doesn't need HTTPS)
- **Alternative**: Keep the dev server on local network and only tunnel for testing

## Alternative: Use GitHub Pages (HTTPS by default)

Since you already have GitHub Pages set up:

1. Push your code to GitHub
2. GitHub Actions will deploy to: `https://tarloksingh.github.io/StreamLink/`
3. This has HTTPS by default!

But you'll still need the signaling server running locally or deploy it somewhere.

## Best Long-term Solution

Deploy both:
1. **Frontend**: GitHub Pages (free, HTTPS)
2. **Signaling Server**: Deploy to Heroku/Railway/Render (free tiers available)

Would you like help setting up any of these options?

