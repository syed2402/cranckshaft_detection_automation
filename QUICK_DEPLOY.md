# Quick Railway Deployment - 10 Steps

## Step 1: Go to Railway
Visit https://railway.app and sign in with GitHub

## Step 2: Create New Project
Click "New Project" → "Deploy from GitHub repo"

## Step 3: Select Repository
Find and select `cranckshaft_detection_automation`

## Step 4: Configure Backend Service
1. Click on the service
2. Settings → Root Directory: `backend`
3. Variables tab → Add:
   - `PORT` = `8765`
   - `DATABASE_PATH` = `/app/data/crankshaft.db`
   - `UPLOAD_DIR` = `/app/data/uploads`
   - `ALLOWED_ORIGINS` = `http://localhost:5173,http://localhost:3000`

## Step 5: Add Volume to Backend
1. Volumes tab → New Volume
2. Mount Path: `/app/data`

## Step 6: Deploy Backend
1. Click "Deploy"
2. Wait for build (2-5 minutes)
3. Copy your backend domain from Settings → Domains
   - Example: `https://cranckshaft-backend.up.railway.app`

## Step 7: Add Frontend Service
1. Project page → "New Service"
2. Select same GitHub repo
3. Settings → Root Directory: `frontend`

## Step 8: Configure Frontend
1. Variables tab → Add:
   - `VITE_API_BASE_URL` = `https://your-backend-domain.up.railway.app`
   
   (Replace with your actual backend domain from Step 6)

## Step 9: Deploy Frontend
1. Click "Deploy"
2. Wait for build (3-5 minutes)
3. Copy your frontend domain from Settings → Domains
   - Example: `https://cranckshaft-frontend.up.railway.app`

## Step 10: Update Backend CORS
1. Go back to backend service
2. Variables tab
3. Update `ALLOWED_ORIGINS` to:
   ```
   http://localhost:5173,http://localhost:3000,https://your-frontend-domain.up.railway.app
   ```
4. Save (triggers redeploy)

---

## Done! 🎉

Your app is now live:
- **Frontend**: https://your-frontend-domain.up.railway.app
- **Backend API**: https://your-backend-domain.up.railway.app
- **API Docs**: https://your-backend-domain.up.railway.app/docs

---

## Testing

1. Visit your frontend URL
2. Upload a profile file
3. Click "Analyze"
4. Check if data appears
5. Test all features

---

## Troubleshooting

**Frontend blank page?**
- Check browser console (F12)
- Verify `VITE_API_BASE_URL` is correct

**Can't connect to backend?**
- Check backend domain is correct
- Verify backend CORS includes frontend URL
- Test backend `/docs` endpoint

**Database lost after redeploy?**
- Verify volume is mounted at `/app/data`
- Check environment variables are set

**Build failed?**
- Check build logs in Railway
- Ensure all files are committed to GitHub
