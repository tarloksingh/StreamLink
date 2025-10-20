# Testing Cross-Device Streaming

## ✅ Setup Complete!

The signaling server is running on your MacBook and the app is integrated with WebRTC.

## 📱 How to Test

### On Your MacBook:

1. **Signaling server is running** ✅ (in background)
2. **Start the dev server**:
   ```bash
   npm run dev
   ```
3. Open browser console (F12) to see connection logs

### On Your iPhone (on same WiFi):

1. Open Safari
2. Go to: `http://192.168.1.74:5173`
3. You should see console logs: "Connected to signaling server"

## 🎬 Test Scenarios

### Scenario 1: MacBook Broadcasts, iPhone Views

**MacBook:**
1. Open `http://localhost:5173`
2. Click "Start Live"
3. Allow camera access
4. Should see "LIVE" indicator
5. Console shows: "Broadcasting stream: [id]"

**iPhone:**
1. Open `http://192.168.1.74:5173`
2. Should see the MacBook's stream in the list!
3. Tap on it
4. Should see "VIEWING" and MacBook's camera feed!

### Scenario 2: iPhone Broadcasts, MacBook Views

**iPhone:**
1. Open `http://192.168.1.74:5173`
2. Tap "Start Live"
3. Allow camera
4. Should see "LIVE"

**MacBook:**
1. Refresh `http://localhost:5173`
2. Should see iPhone's stream in the list
3. Click it
4. Should see iPhone's camera!

## 🔍 Debugging

### Check Signaling Server Logs

In the terminal running the signaling server, you should see:
```
📱 New client connected
📡 Broadcaster registered: [stream-id]
👀 Viewer joined stream: [stream-id]
📤 Forwarded offer to viewer
📤 Forwarded answer to broadcaster
```

### Check Browser Console

**On Broadcaster:**
```
🔌 Connecting to signaling server...
✅ Connected to signaling server
✅ Broadcasting stream: abc123
👀 Viewer joined: xyz789
📤 Sent offer to viewer
```

**On Viewer:**
```
🔌 Connecting to signaling server...
✅ Connected to signaling server
👀 Starting to view stream: abc123
📨 Received offer from broadcaster
📤 Sent answer to broadcaster
Received remote stream
```

## 🐛 Common Issues

### "Can't connect to signaling server"
- Make sure `npm run signaling` is running
- Check your MacBook's IP hasn't changed
- Both devices must be on same WiFi

### "Stream not found"
- Make sure broadcaster started streaming FIRST
- Refresh viewer page
- Check signaling server logs

### "No video showing"
- Check browser console for WebRTC errors
- Allow camera permissions
- Try refreshing both devices

### "ICE connection failed"
- This can happen on some networks
- Both devices should be on same WiFi
- Check firewall isn't blocking connections

## 📊 What You Should See

**When It Works:**
1. ✅ MacBook sees "✅ Connected to signaling server"
2. ✅ iPhone sees "✅ Connected to signaling server"
3. ✅ Broadcaster's stream appears on viewer's home page
4. ✅ Clicking stream shows "VIEWING" status
5. ✅ Real camera feed from broadcaster shows on viewer's screen!

## 🎯 AirPlay Note

**Current State:**
- Broadcast from YOUR device → AirPlay to TV ✅ Works
- View someone else's stream → AirPlay to TV ⚠️ Will mirror

**Why:**
- We're using WebRTC MediaStream (raw camera feed)
- AirPlay wants HLS video URLs (like YouTube)
- To fix this, we'd need to add a media server to convert stream to HLS

**For Now:**
- You CAN stream your camera and AirPlay it
- You CAN view other devices' cameras
- You just can't AirPlay someone else's stream without it mirroring

Want me to add HLS conversion next, or is this good enough?

