# 🚀 Deploy in 10 Minutes - No YAML, Just Website

## 📋 What You Need

- [x] GitHub/GitLab account with your code pushed
- [x] Render.com account (sign up free at https://render.com)

---

## 🎯 3-Step Deployment

### STEP 1️⃣: Deploy Backend (5 min)

1. Go to https://dashboard.render.com
2. **New + → Web Service → Connect GitHub**
3. **Select your repo** → Connect
4. **Fill in:**
   ```
   Name:          audio-hum-remover-api
   Root Dir:      backend
   Build:         pip install -r requirements.txt
   Start:         python app.py
   ```
5. **Environment Variables:**
   ```
   FLASK_ENV = production
   ```
6. **Create Web Service** (choose Free)
7. **📋 COPY THE URL** → Something like `https://audio-hum-remover-api.onrender.com`

---

### STEP 2️⃣: Deploy Frontend (5 min)

1. Same dashboard → **New + → Web Service**
2. **Connect same repo** again
3. **Fill in:**
   ```
   Name:          audio-hum-remover
   Root Dir:      frontend
   Build:         npm install && npm run build
   Start:         npm run start
   ```
4. **Environment Variables:**
   ```
   VITE_API_URL = https://audio-hum-remover-api.onrender.com
   ```
   👆 **Paste YOUR backend URL from Step 1!**
5. **Create Web Service** (choose Free)
6. **📋 COPY THE URL** → Something like `https://audio-hum-remover.onrender.com`

---

### STEP 3️⃣: Link Them Together (1 min)

1. Go to **Backend service** (audio-hum-remover-api)
2. **Environment** → Add new variable:
   ```
   FRONTEND_URL = https://audio-hum-remover.onrender.com
   ```
   👆 **Paste YOUR frontend URL from Step 2!**
3. **Save** → Wait 2 min for redeploy

---

## ✅ TEST IT!

Visit: `https://audio-hum-remover.onrender.com`

- Upload audio file
- Click Process
- Download result

### 🎉 DONE!

---

## 📸 Visual Guide

```
YOU
 │
 ├─ Push code to GitHub
 │
 └─ Go to Render.com
     │
     ├─ Create Backend Service
     │   ├─ Root: backend/
     │   ├─ Build: pip install -r requirements.txt
     │   ├─ Start: python app.py
     │   └─ ENV: FLASK_ENV=production
     │
     ├─ Create Frontend Service
     │   ├─ Root: frontend/
     │   ├─ Build: npm install && npm run build
     │   ├─ Start: npm run start
     │   └─ ENV: VITE_API_URL=<backend-url>
     │
     └─ Update Backend
         └─ ENV: FRONTEND_URL=<frontend-url>
```

---

## 🔧 The 2 URLs You Need

Fill these in as you go:

```
Backend URL:  _______________________________________
              (from Step 1 - use in Step 2)

Frontend URL: _______________________________________
              (from Step 2 - use in Step 3)
```

---

## ⚡ Super Quick Reference

| Service  | Root Dir   | Build Command                     | Start Command   |
| -------- | ---------- | --------------------------------- | --------------- |
| Backend  | `backend`  | `pip install -r requirements.txt` | `python app.py` |
| Frontend | `frontend` | `npm install && npm run build`    | `npm run start` |

### Environment Variables

**Backend:**

- `FLASK_ENV` = `production`
- `FRONTEND_URL` = (your frontend URL)

**Frontend:**

- `VITE_API_URL` = (your backend URL)

---

## 🐛 Problems?

**Service says "Deploy failed"**

- Click "Logs" to see error
- Usually means missing file or typo in command

**App loads but can't process audio**

- Check both services show "Live" status
- Verify environment variables are set
- Check browser console (F12) for errors

**"CORS error" in browser**

- Make sure `FRONTEND_URL` is set in backend
- No trailing slash in URL
- Wait for backend to finish redeploying

---

## 💡 Pro Tip

⏰ **Free tier sleeps after 15 min**

- First visit takes 30-60s to wake up
- After that, works instantly
- Keep both services in same region for speed

---

## 📚 More Help?

- **Quick Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Detailed Guide**: See `RENDER_STEP_BY_STEP.md`
- **Full Documentation**: See `RENDER_DEPLOYMENT_GUIDE.md`

---

**Ready? Let's deploy! 🚀**

Open: https://dashboard.render.com
