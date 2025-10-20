# ✅ Working URLs for Testing

## The Problem
iOS Safari blocks camera access over plain HTTP with IP addresses.

## The Solution
Use `.local` hostname - iOS treats this as a secure context!

---

## 📱 Use These URLs:

### On iPhone (Safari):
```
http://Tarloks-Mac-mini.local:3000
```

### On This Mac (Any browser):
```
http://Tarloks-Mac-mini.local:3000
```
OR
```
http://localhost:3000
```

---

## ✅ What Should Work Now:

1. **iPhone**: 
   - Open Safari
   - Go to `http://Tarloks-Mac-mini.local:3000`
   - Tap "Start Live"
   - **Camera permission should be granted!**
   - You'll see your video feed

2. **Mac**:
   - Open `http://Tarloks-Mac-mini.local:3000`
   - You should see the iPhone's stream in the list
   - Click it to watch

---

## 🔧 Make Sure These Are Running:

Check terminal:
```bash
# Should see signaling server on port 3001
lsof -i :3001

# Should see dev server on port 3000  
lsof -i :3000
```

If not running:
```bash
# Terminal 1
npm run signaling

# Terminal 2  
npm run dev
```

---

## 🐛 If Still Not Working:

Check debug logs on iPhone screen (bottom of black screen shows debug messages)

Or enable Safari Web Inspector:
- Mac Safari > Develop > [Your iPhone] > [Tab]

