# 🎯 Render.com Deployment - Simple Step-by-Step Guide

## 🎬 Before You Start

1. Push your code to GitHub/GitLab/Bitbucket
2. Sign up at [render.com](https://render.com) (free)
3. Have these files ready:
   - ✅ Backend: `requirements.txt`, `app.py`
   - ✅ Frontend: `package.json`, `vite.config.js`

---

## 📦 PART 1: Deploy Backend (Flask API)

### Step 1: Create New Service

1. Go to https://dashboard.render.com
2. Click **"New +"** (top right)
3. Select **"Web Service"**

### Step 2: Connect Repository

1. Click **"Connect GitHub"** (first time only)
2. Authorize Render
3. Select your `signalsFinal` repository
4. Click **"Connect"**

### Step 3: Fill in Settings

```
Name:              audio-hum-remover-api
Region:            Choose closest to you (e.g., Oregon (US West))
Branch:            main
Root Directory:    backend
Runtime:           Python 3
Build Command:     pip install -r requirements.txt
Start Command:     python app.py
```

### Step 4: Environment Variables

Click **"Advanced"** → Add Environment Variables:

```
Key: FLASK_ENV
Value: production

Key: FRONTEND_URL
Value: (leave blank for now)
```

### Step 5: Create Service

1. Choose **"Free"** plan
2. Click **"Create Web Service"**
3. ⏳ Wait 5-10 minutes for deployment
4. ✅ When it shows **"Live"**, your backend is ready!

### Step 6: Copy Your Backend URL

Look for: `https://audio-hum-remover-api.onrender.com`
**📋 SAVE THIS URL!** You'll need it for the frontend.

---

## 🎨 PART 2: Deploy Frontend (React App)

### Step 1: Create Another Service

1. Go back to https://dashboard.render.com
2. Click **"New +"** again
3. Select **"Web Service"**

### Step 2: Connect Same Repository

1. Select your `signalsFinal` repository again
2. Click **"Connect"**

### Step 3: Fill in Settings

```
Name:              audio-hum-remover
Region:            Same as backend (e.g., Oregon)
Branch:            main
Root Directory:    frontend
Runtime:           Node
Build Command:     npm install && npm run build
Start Command:     npm run start
```

### Step 4: Environment Variables

Click **"Advanced"** → Add Environment Variable:

```
Key: VITE_API_URL
Value: https://audio-hum-remover-api.onrender.com
       👆 (paste your backend URL from Part 1)
```

### Step 5: Create Service

1. Choose **"Free"** plan
2. Click **"Create Web Service"**
3. ⏳ Wait 5-10 minutes
4. ✅ When "Live", your frontend is ready!

### Step 6: Copy Your Frontend URL

Look for: `https://audio-hum-remover.onrender.com`
**📋 SAVE THIS URL!** You'll need it next.

---

## 🔗 PART 3: Connect Backend & Frontend

### Update Backend to Allow Frontend Requests

1. Go to your **Backend service** (audio-hum-remover-api)
2. Click **"Environment"** (left sidebar)
3. Find `FRONTEND_URL` variable
4. Click **"Edit"**
5. Paste your frontend URL: `https://audio-hum-remover.onrender.com`
6. Click **"Save Changes"**
7. ⏳ Backend will redeploy (2-3 minutes)

---

## ✅ PART 4: Test Your App!

1. Open your frontend URL: `https://audio-hum-remover.onrender.com`
2. Upload an audio file
3. Click **"Process Audio"**
4. Download the cleaned file

### 🎉 If it works, you're done!

---

## 📊 Visual Flow

```
┌─────────────────┐
│   Your GitHub   │
│   Repository    │
└────────┬────────┘
         │
         ├──────────────────────────────────────────┐
         │                                          │
         ▼                                          ▼
┌─────────────────┐                        ┌─────────────────┐
│  RENDER BACKEND │                        │ RENDER FRONTEND │
│                 │                        │                 │
│  backend/       │                        │  frontend/      │
│  - app.py       │◄───────────────────────┤  - src/         │
│  - requirements │   API Calls            │  - vite.config  │
│                 │   (VITE_API_URL)       │                 │
│  Port: 10000    │                        │  Port: 10000    │
└─────────────────┘                        └─────────────────┘
         │                                          │
         │ FRONTEND_URL                             │
         │ (for CORS)                               │
         └──────────────────────────────────────────┘
```

---

## 🔍 Where to Find Things in Render Dashboard

### For Each Service:

- **Logs**: Click service → "Logs" tab (see real-time output)
- **Environment**: Click service → "Environment" tab (edit variables)
- **Settings**: Click service → "Settings" tab (change config)
- **Deploy**: Manual redeploy button at top right

---

## 🆓 Free Tier Info

**What You Get:**

- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ 500 build minutes/month
- ✅ 100 GB bandwidth/month
- ⚠️ Services sleep after 15 min inactivity
- ⚠️ First load takes 30-60s (waking up)

**Tip:** For production, upgrade to paid ($7/month) to prevent sleep!

---

## 🐛 Common Issues & Fixes

### Issue 1: "Service Unavailable"

**Fix:** Service is waking up from sleep (free tier). Wait 60 seconds and retry.

### Issue 2: "CORS Error" in Browser Console

**Fix:**

- Check `FRONTEND_URL` is set in backend
- Ensure URL has NO trailing slash
- Redeploy backend after changing

### Issue 3: Frontend Shows "Failed to fetch"

**Fix:**

- Check `VITE_API_URL` is set correctly in frontend
- Verify backend shows "Live" status
- Check backend logs for errors

### Issue 4: Build Failed

**Backend Fix:** Check all packages in `requirements.txt` exist
**Frontend Fix:** Make sure `package.json` has all dependencies

---

## 📱 Accessing Your Services

### Your Backend API:

```
https://audio-hum-remover-api.onrender.com/api/process-audio
```

### Your Frontend App:

```
https://audio-hum-remover.onrender.com
```

---

## 🎓 Next Steps (Optional)

### Add Custom Domain

1. Go to service → Settings
2. Scroll to "Custom Domain"
3. Add your domain (e.g., `audio-cleaner.com`)
4. Update DNS records as shown

### Monitor Performance

1. Go to service → Metrics
2. View CPU, Memory, Response times
3. Upgrade if needed

### Set Up Alerts

1. Settings → Notifications
2. Add email for deployment failures
3. Get notified of issues

---

## 📝 Environment Variables Reference

### Backend Service

```bash
FLASK_ENV=production
FRONTEND_URL=https://audio-hum-remover.onrender.com
# PORT is auto-set by Render
```

### Frontend Service

```bash
VITE_API_URL=https://audio-hum-remover-api.onrender.com
# PORT is auto-set by Render
```

---

## 💡 Pro Tips

1. **Same Region**: Deploy both services in same region for faster communication
2. **Logs**: Always check logs first when troubleshooting
3. **Environment**: After changing env vars, service redeploys automatically
4. **Free Tier**: One service can stay awake 24/7 on free tier
5. **Custom Domains**: Free on all plans!

---

## ✨ You Did It!

Your Audio Hum Remover is now live on the internet! 🚀

Share your URL with others:
`https://audio-hum-remover.onrender.com`

---

## 📞 Need Help?

- Render Docs: https://render.com/docs
- Community: https://community.render.com
- Your service logs (most helpful!)

---

**Made by:**

- Dan Lius Monsales
- Eduardo Miguel Cortes
- Regine Christian Buenafe

🎉 Happy Deploying!
