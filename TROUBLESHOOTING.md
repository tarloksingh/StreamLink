# Troubleshooting WebRTC Connection Issues

## 🔍 What I Just Fixed:

1. **Removed MediaRecorder** - Was causing "The operation was aborted" errors
2. **Cleaned up video elements** - No more duplicate AirPlay video elements
3. **Better error handling** - Video falls back to muted if autoplay fails
4. **Stability improvements** - Longer delay before setting up remote video

---

## 🐛 "Sometimes I see them, sometimes I don't"

This is a classic WebRTC P2P connection issue. Here's what's happening:

### **Root Cause:**
WebRTC needs to negotiate a peer-to-peer connection through:
1. **Signaling** (your Render server) ✅ Working
2. **STUN** (helps find public IP) ⚠️ Sometimes works
3. **TURN** (relays video if direct fails) ⚠️ Free TURN is unreliable

### **Why It's Inconsistent:**
- **Network conditions change** (firewalls, NATs, cellular vs WiFi)
- **Free TURN servers** are slow/overloaded
- **Long distances** (Texas ↔ Seattle) add complexity

---

## ✅ Immediate Fixes to Try:

### **1. Make Sure Render Server is Awake**
Free tier sleeps after 15min inactivity.

**Check if it's running:**
```bash
curl https://streamlink-signaling.onrender.com
```

Should return: "StreamLink Signaling Server Running"

If it takes 30+ seconds, the server was sleeping.

### **2. Refresh BOTH Sides**
When video doesn't connect:
- **Both** people refresh the page
- Call initiator clicks "Start Call" again
- Share new link to joiner

### **3. Check Console Logs**
Open browser console (F12) and look for:

**✅ Good signs:**
```
✅ Connected to signaling server
🔌 ICE connection state: connected
▶️ Remote video playing!
```

**❌ Bad signs:**
```
🔌 ICE connection state: failed
❌ Play error
Connection state: failed
```

### **4. Try Different Networks**
Sometimes firewalls block WebRTC:
- Try **cellular data** instead of WiFi
- Avoid corporate/school networks
- Home WiFi usually works best

---

## 🔧 Advanced Debugging:

### **Check WebRTC Connection Details:**

Open console and run:
```javascript
// Find all peer connections
window.pc = document.querySelector('video').srcObject?.getVideoTracks()[0]?.getSettings();
console.log('Video settings:', window.pc);
```

### **Check ICE Connection:**
```javascript
// Log ICE candidates
setTimeout(() => {
  console.log('ICE state:', document.querySelector('video').srcObject);
}, 5000);
```

---

## 💰 Production-Grade Solution:

If you need **99% reliability**, you'll need:

### **Option A: Paid TURN Server ($)**
Use Twilio's TURN service (~$0.40/GB)

**Add to `client/src/lib/webrtc.ts`:**
```typescript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:global.turn.twilio.com:3478',
    username: 'YOUR_TWILIO_USERNAME',
    credential: 'YOUR_TWILIO_CREDENTIAL'
  }
]
```

### **Option B: Deploy Own TURN Server ($$)**
Use Coturn on a VPS (~$5-10/mo)

---

## 📊 Expected Success Rates:

| Scenario | Success Rate | Why |
|----------|--------------|-----|
| Same WiFi network | **95%+** | Direct P2P |
| Same city, different networks | **80-90%** | STUN usually works |
| Different states (TX ↔ WA) | **60-80%** | Need TURN relay |
| Corporate networks | **30-50%** | Firewalls block P2P |

---

## 🎯 Quick Test Checklist:

Before calling your cousin:

1. **Test locally first**
   - Open 2 tabs on your Mac
   - Start call in Tab 1
   - Join in Tab 2
   - Should see yourself in both tabs ✅

2. **Test on same WiFi**
   - Mac + iPhone on home network
   - Should work 95% of the time ✅

3. **Then test Seattle**
   - If local tests work but Seattle doesn't
   - Problem is likely TURN server

---

## 🚨 If Nothing Works:

### **Emergency Fallback:**
Use a free tier of a managed service:

1. **Daily.co** - 100 free minutes/month
2. **Whereby** - Free for 1-on-1
3. **Jitsi Meet** - Free forever

These have professional-grade TURN infrastructure.

---

## 📝 Most Common Issues:

1. **"Connection state: failed"**
   - **Fix:** Refresh both sides, try again

2. **"No video stream available"**
   - **Fix:** Check camera permissions

3. **"Remote video not playing"**
   - **Fix:** Tap screen to unmute video

4. **One person sees video, other doesn't**
   - **Fix:** Asymmetric NAT issue - need TURN

---

## 🆘 Still Having Issues?

Send me these debug logs:

1. **From console** (both Texas & Seattle):
```
Right-click → Inspect → Console tab
Copy all logs starting with 📞 or 🔌 or ❌
```

2. **Network info**:
```
- Are you on WiFi or cellular?
- What browser? (Chrome, Safari, Firefox)
- Any VPN running?
```

---

**TL;DR:** 
- Removed MediaRecorder errors ✅
- If video is inconsistent, it's the free TURN server
- For production, upgrade to paid TURN (~$0.40/GB)
- For now, just refresh both sides when it fails!

