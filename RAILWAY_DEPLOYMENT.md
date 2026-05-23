# Railway Deployment Guide - Both Frontend & Backend

This guide will help you deploy both the React frontend and FastAPI backend on Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub repository (already done: https://github.com/syed2402/cranckshaft_detection_automation)
- GitHub connected to Railway

---

## Step 1: Create Railway Project

1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Select your `cranckshaft_detection_automation` repository
6. Click **"Deploy"**

Railway will create a project and auto-detect your services.

---

## Step 2: Configure Backend Service

### 2.1 Set Root Directory
1. In Railway dashboard, click on your project
2. You should see a service (likely named after your repo)
3. Click on the service
4. Go to **"Settings"** tab
5. Find **"Root Directory"** and set to: `backend`
6. Save

### 2.2 Add Environment Variables
1. Go to **"Variables"** tab
2. Add these variables:

```
PORT=8765
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
DATABASE_PATH=/app/data/crankshaft.db
UPLOAD_DIR=/app/data/uploads
```

3. Click **"Add Variable"** for each one

### 2.3 Add Persistent Volume
1. Go to **"Volumes"** tab
2. Click **"New Volume"**
3. Set **Mount Path** to: `/app/data`
4. Click **"Create"**

This ensures your database and uploads persist between deployments.

### 2.4 Verify Build & Start Commands
1. Go to **"Settings"** tab
2. Verify **Build Command**: `pip install -r requirements.txt`
3. Verify **Start Command**: `uvicorn main:app --host 0.0.0.0 --port ${PORT}`

---

## Step 3: Deploy Backend

1. Go back to your service
2. Click **"Deploy"** or wait for auto-deployment
3. Watch the build logs - should take 2-5 minutes
4. When complete, you'll see a green checkmark

### Get Backend URL
1. In your service, go to **"Settings"**
2. Find **"Domains"** section
3. Copy your domain (e.g., `https://cranckshaft-backend.up.railway.app`)
4. **Save this URL** - you'll need it for the frontend

### Test Backend
1. Visit: `https://your-backend-domain.up.railway.app/docs`
2. You should see FastAPI Swagger UI
3. If yes, backend is working! ✓

---

## Step 4: Add Frontend Service

### 4.1 Create New Service
1. In Railway project, click **"New Service"**
2. Select **"GitHub repo"**
3. Select the same `cranckshaft_detection_automation` repo
4. Click **"Deploy"**

### 4.2 Configure Frontend Service
1. Click on the new frontend service
2. Go to **"Settings"** tab
3. Set **Root Directory** to: `frontend`

### 4.3 Add Environment Variables
1. Go to **"Variables"** tab
2. Add:

```
VITE_API_BASE_URL=https://your-backend-domain.up.railway.app
```

Replace `your-backend-domain` with your actual backend domain from Step 3.

### 4.4 Verify Build & Start Commands
1. Go to **"Settings"** tab
2. Verify **Build Command**: `npm install && npm run build`
3. Verify **Start Command**: `npm run preview -- --host 0.0.0.0 --port ${PORT}`

---

## Step 5: Deploy Frontend

1. Click **"Deploy"** on the frontend service
2. Wait for build to complete (usually 3-5 minutes)
3. When done, you'll see a green checkmark

### Get Frontend URL
1. In frontend service, go to **"Settings"**
2. Find **"Domains"** section
3. Copy your domain (e.g., `https://cranckshaft-frontend.up.railway.app`)

---

## Step 6: Update Backend CORS Settings

Now that you have both URLs, update the backend to allow your frontend:

1. Go to backend service
2. Go to **"Variables"** tab
3. Update `ALLOWED_ORIGINS` to:

```
http://localhost:5173,http://localhost:3000,https://your-frontend-domain.up.railway.app
```

Replace `your-frontend-domain` with your actual frontend domain.

4. Save - this will trigger a backend redeploy

---

## Step 7: Test Everything

1. Visit your frontend URL: `https://your-frontend-domain.up.railway.app`
2. You should see the Crankshaft Profile DIS interface
3. Try uploading a profile file
4. Click "Analyze"
5. Check if data appears and trends show up
6. Test all features:
   - Upload profiles
   - View graphs
   - Check trends
   - Test operator overrides

---

## Troubleshooting

### Backend won't start
- Check logs: Service → Logs tab
- Look for error messages
- Verify all environment variables are set
- Check if volume is mounted correctly

### Frontend shows blank page
- Check browser console for errors (F12)
- Verify `VITE_API_BASE_URL` is correct
- Check if backend is running and accessible

### Frontend can't connect to backend
- Verify backend domain in `VITE_API_BASE_URL`
- Check backend CORS settings include frontend URL
- Test backend directly: visit `/docs` endpoint

### Database/uploads lost after redeploy
- Verify volume is mounted at `/app/data`
- Check `DATABASE_PATH` and `UPLOAD_DIR` variables
- Restart service to remount volume

### Build fails
- Check build logs for specific errors
- Ensure `requirements.txt` and `package.json` are correct
- Try manual redeploy

---

## Service URLs Reference

After deployment, you'll have:

- **Backend API**: `https://your-backend-domain.up.railway.app`
- **Backend Docs**: `https://your-backend-domain.up.railway.app/docs`
- **Frontend**: `https://your-frontend-domain.up.railway.app`

---

## Environment Variables Summary

### Backend (.env or Railway Variables)
```
PORT=8765
ALLOWED_ORIGINS=https://your-frontend-domain.up.railway.app
DATABASE_PATH=/app/data/crankshaft.db
UPLOAD_DIR=/app/data/uploads
```

### Frontend (.env.production or Railway Variables)
```
VITE_API_BASE_URL=https://your-backend-domain.up.railway.app
```

---

## Next Steps

1. Follow steps 1-7 above
2. Monitor deployments in Railway dashboard
3. Check logs if anything fails
4. Test all features
5. Share your deployed app!

For more help, visit: https://docs.railway.app
