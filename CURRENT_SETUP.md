# 🎯 Current Working Setup

## ✅ What's Running:

1. **Dev Server** (port 3000): `localhost:3000`
   - Tunneled via ngrok: `https://endodermic-contextually-malaya.ngrok-free.dev`

2. **Signaling Server** (port 3001): `localhost:3001`
   - Tunneled via localtunnel: `https://easy-pumas-move.loca.lt`

## 📱 URLs to Use:

### On iPhone & Mac (same URL for both):
```
https://endodermic-contextually-malaya.ngrok-free.dev
```

## 🔄 To Restart Everything:

If things stop working, run these commands in order:

### Terminal 1: Signaling Server
```bash
npm run signaling
```

### Terminal 2: Dev Server
```bash
npm run dev
```

### Terminal 3: ngrok (Web App)
```bash
ngrok http 3000
# Copy the https URL
```

### Terminal 4: localtunnel (Signaling)
```bash
npx localtunnel --port 3001
# Copy the https URL and update client/src/lib/config.ts
```

## 🐛 If streams don't appear:

1. **Refresh both iPhone and Mac browsers**
2. Check browser console for "Connected to signaling server" message
3. Make sure both devices use the same ngrok URL
4. Check signaling server terminal for "Broadcaster registered" message

## 📝 Notes:

- **ngrok free tier**: Only 1 tunnel at a time
- **localtunnel**: Unlimited but URLs change on restart
- Both iPhone and Mac must use the HTTPS URLs (not localhost)
- Changes to config.ts require page refresh to take effect

