# Quick Test Guide - Three Device Setup

## 🖥️ Your Setup

1. **This Mac (192.168.1.74)** - Running signaling server
2. **Your MacBook** - Running broadcaster
3. **Your iPhone** - Viewing the stream

All on same WiFi ✅

## 📋 Step-by-Step

### Step 1: This Mac (Signaling Server)

**Already running!** ✅ Keep this terminal open.

You should see:
```
🚀 StreamLink Signaling Server
✅ Server listening on port 3001
🌐 WebSocket URL: ws://localhost:3001
```

### Step 2: Your MacBook (Broadcaster)

1. **Clone or copy the repo** to your MacBook:
   ```bash
   git clone https://github.com/tarloksingh/StreamLink.git
   cd StreamLink
   npm install
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Open browser**: `http://localhost:5173`

4. **Open browser console** (press F12) - You should see:
   ```
   📡 Signaling server URL: ws://192.168.1.74:3001
   🔌 Connecting to signaling server...
   ✅ Connected to signaling server
   ```

5. **Click "Start Live"** → Allow camera access

6. **Check console**:
   ```
   ✅ Broadcasting stream: [stream-id]
   ```

### Step 3: Your iPhone (Viewer)

1. **Open Safari**: `http://192.168.1.74:5173`

2. **You should see**:
   - The home page loads
   - Console (if you enable it): "✅ Connected to signaling server"
   - **Your MacBook's live stream appears in the list!** 📺

3. **Tap the stream**:
   - Should see "VIEWING" status
   - **Should see your MacBook's camera!** 🎉

## 🔍 What to Check

### On This Mac (Signaling Server Terminal):
```
📱 New client connected          ← MacBook connects
📱 New client connected          ← iPhone connects
📡 Broadcaster registered: xyz   ← MacBook starts streaming
👀 Viewer joined stream: xyz     ← iPhone watches
📤 Forwarded offer to viewer     ← Connecting them
📤 Forwarded answer to broadcaster ← Connection established
```

### On MacBook (Console):
```
✅ Connected to signaling server
✅ Broadcasting stream: xyz
👀 Viewer joined: abc
📤 Sent offer to viewer: abc
📨 Received answer from viewer
✅ Set remote description from answer
```

### On iPhone (Safari Console - if enabled):
```
✅ Connected to signaling server
👀 Starting to view stream: xyz
📨 Received offer from broadcaster
📤 Sent answer to broadcaster
Received remote stream
Remote video playing
```

## 🎬 What You Should See

### MacBook Screen:
- Your own camera feed
- "LIVE" indicator (red)
- Share and End Live buttons

### iPhone Screen:
- "VIEWING" indicator (blue)
- **MacBook's camera feed streaming!**
- AirPlay and Back buttons

## 🐛 Troubleshooting

### "No streams showing on iPhone"
1. Make sure MacBook clicked "Start Live" FIRST
2. Refresh iPhone Safari
3. Check signaling server shows both clients connected

### "Can't connect to signaling server"
1. All devices on same WiFi? (check WiFi name)
2. This Mac's IP still 192.168.1.74? Run: `ipconfig getifaddr en0`
3. Firewall blocking? Check System Preferences → Security → Firewall

### "Connected but no video"
1. Check browser console for WebRTC errors
2. Allow camera permissions on MacBook
3. Try refreshing both devices
4. Check signaling server shows "Forwarded offer/answer"

### "Video is black or frozen"
1. Make sure camera isn't being used by another app
2. Try closing and reopening browser
3. Check MacBook camera light is on

## 🎯 Success Criteria

✅ **Signaling server** shows 2 clients connected  
✅ **MacBook** shows "LIVE" and "Broadcasting stream"  
✅ **iPhone** sees stream in the list  
✅ **iPhone** can tap and see MacBook's camera  
✅ **Video is smooth** and updates in real-time  

## 📱 Next: Test iPhone Broadcasting

Once MacBook → iPhone works, try reverse:

1. **iPhone**: Open Safari, Start Live
2. **MacBook**: Refresh, should see iPhone's stream!
3. **MacBook**: Click to watch iPhone's camera

## 🎉 When It Works

You'll know it's working when:
- iPhone opens the app
- Sees "Live Stream xyz" in the list
- Taps it
- **BAM! MacBook's camera appears on iPhone!** 🎊

This is REAL peer-to-peer video streaming!

---

**Current Status**: Signaling server running ✅  
**Next Step**: Set up MacBook and try streaming!

