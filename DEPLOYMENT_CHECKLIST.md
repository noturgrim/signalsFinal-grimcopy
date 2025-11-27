# Quick Deployment Checklist for Render.com

## ✅ Pre-Deployment Setup (Already Done)

- [x] Frontend uses environment variables (`VITE_API_URL`)
- [x] Backend uses environment variables (`PORT`, `FRONTEND_URL`, `FLASK_ENV`)
- [x] CORS configured in backend
- [x] Build commands configured
- [x] `.env` added to `.gitignore`

## 🚀 Deployment Steps

### 1. Deploy Backend First

**On Render.com Dashboard:**

1. New + → Web Service → Connect Repository
2. **Settings:**

   - Name: `audio-hum-remover-api`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`

3. **Environment Variables:**

   ```
   FLASK_ENV = production
   FRONTEND_URL = (leave empty, update later)
   ```

4. Deploy → Copy Backend URL ✏️ `https://your-backend.onrender.com`

---

### 2. Deploy Frontend

**On Render.com Dashboard:**

1. New + → Web Service → Connect Same Repository
2. **Settings:**

   - Name: `audio-hum-remover`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

3. **Environment Variables:**

   ```
   VITE_API_URL = https://your-backend.onrender.com (paste backend URL)
   ```

4. Deploy → Copy Frontend URL ✏️ `https://your-frontend.onrender.com`

---

### 3. Update Backend CORS

**Go to Backend Service:**

1. Environment → Edit `FRONTEND_URL`
2. Paste: `https://your-frontend.onrender.com`
3. Save → Auto-redeploys

---

### 4. Test Everything

1. Visit your frontend URL
2. Upload a test audio file
3. Process it
4. Download the result

✅ **Done!**

---

## 📝 Quick Reference

### Backend URL Pattern

`https://[service-name].onrender.com`

### Frontend URL Pattern

`https://[service-name].onrender.com`

### Environment Variables

**Backend:**

- `FLASK_ENV=production`
- `FRONTEND_URL=https://your-frontend-url.onrender.com`

**Frontend:**

- `VITE_API_URL=https://your-backend-url.onrender.com`

---

## 🐛 Troubleshooting

**Frontend can't reach backend?**

- Check `VITE_API_URL` is set correctly
- Check browser console for errors
- Verify backend is "Live" in Render

**CORS errors?**

- Check `FRONTEND_URL` is set in backend
- Ensure it matches exactly (no trailing slash)

**Service spinning down?**

- Normal for free tier
- First request takes 30-60s to wake up
- Upgrade to paid plan to prevent spin down

---

## 📖 Full Guide

See `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions.
