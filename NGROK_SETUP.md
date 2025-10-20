# 🚀 Quick ngrok Setup (30 seconds)

## Step 1: Sign Up (Free)
Go to: https://dashboard.ngrok.com/signup
- Click "Sign up with GitHub" (easiest)
- Done!

## Step 2: Get Your Token
- After signup, you'll see: "Your Authtoken"
- Copy it (looks like: `2abc...xyz`)

## Step 3: Install Token
```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

## Step 4: Start Tunnel
```bash
ngrok http 3000
```

You'll see:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

## Step 5: Test
**Copy that https URL and use it on your iPhone!**

---

## Then Run These Commands:

```bash
# Terminal 1: Signaling Server
npm run signaling

# Terminal 2: Dev Server  
npm run dev

# Terminal 3: ngrok
ngrok http 3000
```

Use the ngrok HTTPS URL on both iPhone and Mac!

**That's it! Camera will work because it's HTTPS!** 📱✅

