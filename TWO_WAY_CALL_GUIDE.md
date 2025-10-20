# Two-Way Video Calling - Testing Guide

## ✅ What's New - Version 5

StreamLink now supports **two-way video calling** where both participants can:
- See each other in real-time
- Have their own camera active
- AirPlay the call to their TV (via screen mirroring)

## 🎥 Video Layout

**During a Call:**
- **Remote Person's Video** → Full screen (main view)
- **Your Video** → Small corner (picture-in-picture)

This is the same layout as FaceTime, Zoom, etc.

## 📱 How to Test (Two Devices)

### Device 1 (Your Mac with ngrok):

1. **Make sure ngrok is running:**
   ```bash
   ngrok http 3000
   ```
   You'll get a URL like: `https://a1b2-c3d4.ngrok-free.app`

2. **Make sure signaling server is running:**
   ```bash
   npm run signaling
   ```
   (Should be on port 3001)

3. **Open the ngrok URL in your Mac's browser**

4. **Click "Start Call"**
   - Your camera will turn on
   - You'll see yourself in the small corner
   - You'll see "Waiting for other person..." in the main area

5. **Click the Share button (or copy the URL)**
   - Send this link to your iPhone

### Device 2 (Your iPhone):

1. **Open the link from Device 1**
   - It will look like: `https://.../?call=abc123&mode=joiner`

2. **Grant camera/microphone permissions**

3. **You should now see:**
   - **Main view:** The person from Device 1 (your Mac)
   - **Small corner:** Your own face (from iPhone camera)

4. **Both devices are now in a call!**

## 🖥️ AirPlay to TV (Screen Mirroring)

Since we're using WebRTC (peer-to-peer), AirPlay works via **screen mirroring**:

1. **While in a call, tap native fullscreen button on video**
2. **Swipe down from top-right on iPhone → AirPlay**
3. **Select your Apple TV**
4. **Your entire screen (including the call) will mirror to TV**

## 🎯 What You'll See on Each Device

### **Call Initiator (starts the call):**
- ✅ Can share link to invite others
- ✅ Sees own camera in corner
- ✅ Sees remote person full-screen when they join
- ✅ Has "End Call" button

### **Call Joiner (joins via link):**
- ✅ Sees own camera in corner
- ✅ Sees remote person full-screen
- ✅ Has "End Call" button

## 🔧 Troubleshooting

### "Camera access requires HTTPS"
- Make sure you're using the **ngrok HTTPS URL** on iPhone
- On Mac, you can use `localhost:3000` (works without HTTPS)

### "No video stream available"
- Check that signaling server is running: `npm run signaling`
- Check that both devices are on same network
- Check browser console for WebRTC errors

### "Connection failed"
- Sometimes NAT/firewall blocks direct P2P
- Free TURN servers might be slow
- Try from same WiFi network first

### "Video is black/frozen"
- Refresh the page
- Make sure camera permissions are granted
- Check if another app is using your camera

## 🆚 Difference from Before

| Feature | Old (One-Way) | New (Two-Way) |
|---------|---------------|---------------|
| **Camera** | Only broadcaster | **Both people** |
| **Video** | One direction | **Bidirectional** |
| **Layout** | Full screen only | **PIP layout** |
| **Use Case** | Live streaming | **Video calls** |

## 💰 Still Costs $0/month to Scale!

- WebRTC is peer-to-peer
- Signaling server uses minimal resources
- No video goes through your servers

## 🚀 Ready to Test!

1. **Mac:** Start ngrok + signaling server
2. **Mac:** Open ngrok URL → Start Call
3. **iPhone:** Open shared link → Join Call
4. **Both:** You should see each other!
5. **Try AirPlay:** Fullscreen → AirPlay → TV

---

**Need help?** Check the console logs for detailed connection info.

**Want true AirPlay (not mirroring)?** That requires HLS media server (~$25-150/mo depending on scale).

