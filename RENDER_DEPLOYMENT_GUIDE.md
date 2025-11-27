# Deploy Audio Hum Remover to Render.com

This guide will help you deploy both the **Backend (Flask API)** and **Frontend (React)** to Render.com using their web interface.

---

## Prerequisites

1. A [Render.com](https://render.com) account (free tier available)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. If not using Git, you can deploy manually (see alternative method below)

---

## Part 1: Deploy Backend (Flask API)

### Step 1: Create a New Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** button in the top right
3. Select **"Web Service"**

### Step 2: Connect Your Repository

1. If first time: Click **"Connect GitHub"** (or GitLab/Bitbucket)
2. Authorize Render to access your repositories
3. Find and select your `signalsFinal` repository
4. Click **"Connect"**

### Step 3: Configure Backend Service

Fill in the following settings:

- **Name**: `audio-hum-remover-api` (or any name you prefer)
- **Region**: Choose closest to your location
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`

### Step 4: Set Environment Variables

Scroll down to **"Environment Variables"** section and add:

| Key            | Value                                                             |
| -------------- | ----------------------------------------------------------------- |
| `FLASK_ENV`    | `production`                                                      |
| `FRONTEND_URL` | (Leave empty for now, we'll update this after deploying frontend) |

### Step 5: Choose Plan and Deploy

1. Select **"Free"** plan (or paid if needed)
2. Click **"Create Web Service"**
3. Wait for deployment (5-10 minutes)
4. **Copy the backend URL** (looks like: `https://audio-hum-remover-api.onrender.com`)

---

## Part 2: Deploy Frontend (React + Vite)

### Step 1: Create Another Web Service

1. Go back to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** button
3. Select **"Web Service"**

### Step 2: Connect Same Repository

1. Select your `signalsFinal` repository again
2. Click **"Connect"**

### Step 3: Configure Frontend Service

Fill in the following settings:

- **Name**: `audio-hum-remover` (or any name you prefer)
- **Region**: Same as backend (recommended)
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`

### Step 4: Set Environment Variables

Add this environment variable:

| Key            | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| `VITE_API_URL` | Paste your backend URL from Part 1 (e.g., `https://audio-hum-remover-api.onrender.com`) |

### Step 5: Deploy Frontend

1. Select **"Free"** plan
2. Click **"Create Web Service"**
3. Wait for deployment (5-10 minutes)
4. **Copy the frontend URL** (looks like: `https://audio-hum-remover.onrender.com`)

---

## Part 3: Update Backend CORS Settings

Now that we have the frontend URL, we need to update the backend to allow requests from it.

### Step 1: Update Backend Environment Variable

1. Go to your **Backend service** in Render Dashboard
2. Click on **"Environment"** in the left sidebar
3. Find the `FRONTEND_URL` variable
4. **Update its value** to your frontend URL (e.g., `https://audio-hum-remover.onrender.com`)
5. Click **"Save Changes"**
6. Backend will automatically redeploy

---

## Part 4: Test Your Deployment

1. Visit your frontend URL (e.g., `https://audio-hum-remover.onrender.com`)
2. Upload an audio file
3. Click "Process Audio"
4. Verify that it works correctly

---

## Important Notes

### Free Tier Limitations

- **Spin Down**: Free services spin down after 15 minutes of inactivity
- **First Load**: Will take 30-60 seconds to wake up
- **Bandwidth**: 100 GB/month free
- **Build Minutes**: 500 minutes/month free

### Troubleshooting

#### Backend Issues

1. Check backend logs:

   - Go to your backend service
   - Click **"Logs"** tab
   - Look for errors

2. Common issues:
   - Missing dependencies in `requirements.txt`
   - Port configuration (ensure using `$PORT` environment variable)
   - CORS errors (check `FRONTEND_URL` is set correctly)

#### Frontend Issues

1. Check frontend logs similarly
2. Common issues:
   - `VITE_API_URL` not set correctly
   - Build command failed (check Node version)
   - Preview command not working

### Custom Domains (Optional)

To use your own domain:

1. Go to your service **"Settings"**
2. Scroll to **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Follow DNS configuration instructions

---

## Alternative: Manual Deployment (No Git)

If you don't want to use Git:

### For Backend:

1. Install Render CLI: `npm install -g render-cli`
2. Login: `render login`
3. Deploy: `render deploy --service backend`

### For Frontend:

1. Build locally: `cd frontend && npm run build`
2. Deploy the `dist` folder to a static site hosting service like:
   - Render Static Sites
   - Netlify
   - Vercel

---

## Monitoring and Maintenance

### View Logs

- Go to your service in Render Dashboard
- Click **"Logs"** tab
- View real-time logs

### Redeploy

- Automatic: Push to your Git repository
- Manual: Click **"Manual Deploy"** → **"Deploy latest commit"**

### Scale Up

- Go to **"Settings"**
- Change instance type under **"Instance Type"**
- Upgrade to paid plan for:
  - No spin down
  - More resources
  - Better performance

---

## Environment Variables Reference

### Backend (`audio-hum-remover-api`)

```
FLASK_ENV=production
FRONTEND_URL=https://your-frontend-url.onrender.com
PORT=10000 (automatically set by Render)
```

### Frontend (`audio-hum-remover`)

```
VITE_API_URL=https://your-backend-url.onrender.com
PORT=10000 (automatically set by Render)
```

---

## Support

If you encounter issues:

1. Check Render's [Documentation](https://render.com/docs)
2. Review service logs for errors
3. Verify all environment variables are set correctly
4. Ensure both services are in the same region for better performance

---

## Summary Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Backend URL added to frontend's `VITE_API_URL`
- [ ] Frontend URL added to backend's `FRONTEND_URL`
- [ ] Test the app end-to-end
- [ ] Both services show "Live" status in Render Dashboard

🎉 **Congratulations!** Your Audio Hum Remover is now live!
