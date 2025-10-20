# Debug Guide - Live Streaming Issues

## Current Issue
- iPhone doesn't show video when tapping "Start Live"
- Mac doesn't see the live stream in the list

## How to Debug

### Step 1: Check on iPhone (Safari)

1. Open Safari on iPhone: `http://192.168.1.74:3000`
2. Enable Safari Developer Tools:
   - On Mac: Safari > Develop > [Your iPhone] > [Tab Name]
   - This will show the console logs from your iPhone

3. **What to look for in console:**
   ```
   ✅ Good signs:
   🔌 Connecting to signaling server...
   ✅ Connected to signaling server
   🎥 Starting broadcast for stream: [id]
   📸 Requesting camera/microphone access...
   ✅ Got media stream
   ➕ Added track to peer connection: video
   ➕ Added track to peer connection: audio
   📡 Registering as broadcaster with signaling server...
   📤 Sending to signaling server: broadcaster {type: "broadcaster", streamId: "...", streamTitle: "..."}
   ✅ Broadcasting stream: [id]
   
   ❌ Bad signs:
   ❌ WebSocket not connected
   ❌ Signaling client not connected
   Error starting broadcast: [error]
   ```

### Step 2: Check Signaling Server Terminal

Look for these messages:
```
✅ Good:
📱 New client connected
📨 Received: broadcaster [streamId]
📡 Broadcaster registered: [streamId]

❌ Bad:
No messages appearing = client not connecting
❓ Unknown message type = message format mismatch
```

### Step 3: Check on Mac Browser

1. Open `http://localhost:3000` in Chrome/Safari
2. Open Developer Console (Cmd+Option+I)
3. **What to look for:**
   ```
   ✅ Good:
   🔌 Connecting to signaling server for stream list...
   ✅ Home page: Connected to signaling server
   📋 Home page: Requesting stream list...
   📤 Sending to signaling server: get-streams
   📨 Received message: stream-list
   📺 Received stream list: [array of streams]
   
   ❌ Bad:
   📺 Received stream list: [] (empty array)
   Connection refused / WebSocket error
   ```

## Common Issues & Fixes

### Issue 1: iPhone can't connect to signaling server
**Symptom:** Console shows "Connection refused" or no connection logs
**Fix:** 
- Make sure iPhone is on same WiFi as Mac
- Check signaling server is running: `ps aux | grep signaling`
- Try accessing `http://192.168.1.74:3001` in iPhone Safari - should show "StreamLink Signaling Server Running"

### Issue 2: Camera permission denied
**Symptom:** Error message about camera access
**Fix:**
- iPhone Settings > Safari > Camera > Ask (or Allow)
- Refresh the page

### Issue 3: Signaling server not receiving messages
**Symptom:** No messages in terminal when iPhone taps "Start Live"
**Fix:**
- Check if multiple signaling servers are running
- Restart signaling server: `npm run signaling`

### Issue 4: Video element not showing stream
**Symptom:** Camera works but black screen
**Fix:**
- Check if `videoRef.current` is null
- Check if `srcObject` is set correctly
- Look for video errors in console

## Test Checklist

On iPhone:
- [ ] Can access http://192.168.1.74:3000
- [ ] See "Start Live" button
- [ ] Tap button, camera permission requested
- [ ] Grant camera permission
- [ ] See "LIVE" indicator with own video
- [ ] Console shows all ✅ messages

On Mac:
- [ ] Can access http://localhost:3000
- [ ] See "Connected to Signaling Server" message
- [ ] See stream card appear in grid
- [ ] Stream card shows correct title
- [ ] Can click stream card

On Terminal:
- [ ] `npm run signaling` is running
- [ ] `npm run dev` is running  
- [ ] See "Broadcaster registered" message when iPhone starts
- [ ] See "Viewer joined" message when Mac clicks stream

## Network Debug

Test signaling server connectivity:

**From iPhone Safari:**
1. Go to: `http://192.168.1.74:3001`
2. Should see: "StreamLink Signaling Server Running"

**From Mac Terminal:**
```bash
# Check signaling server is running
curl http://192.168.1.74:3001

# Check what's listening on port 3001
lsof -i :3001

# Check what's listening on port 3000
lsof -i :3000
```

## Still Not Working?

Run this complete diagnostic:

```bash
# 1. Check processes
ps aux | grep node

# 2. Kill all node processes
pkill -f node

# 3. Start signaling server fresh
npm run signaling

# 4. In another terminal, start dev server
npm run dev

# 5. Check ports
lsof -i :3000
lsof -i :3001

# 6. Get your Mac's IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Then try the test again from iPhone.

