# How to Add a Volume in Railway - Step by Step

## What is a Volume?
A volume is persistent storage that keeps your data (database, uploads) even after your app restarts or redeploys.

---

## Method 1: Using Railway Dashboard (Easiest)

### Step 1: Go to Your Service
1. Open https://railway.app
2. Click on your **project**
3. You should see your backend service listed
4. **Click on the backend service** to open it

### Step 2: Find the Storage Section
1. In the service details, look for tabs at the top
2. You should see tabs like: **Overview**, **Settings**, **Variables**, **Logs**, etc.
3. Look for a **"Storage"** or **"Volumes"** tab
   - If you don't see it, scroll right in the tabs
   - It might be under a **"..."** menu

### Step 3: Create New Volume
1. Click on **"Storage"** or **"Volumes"** tab
2. Click **"New Volume"** or **"Add Volume"** button
3. A form will appear

### Step 4: Configure Volume
In the form, you'll see:
- **Mount Path**: Enter `/app/data`
- **Size** (optional): Leave as default or set to 5GB
- Click **"Create"** or **"Add"**

---

## Method 2: If You Can't Find the Tab

Sometimes the Volumes tab is hidden. Try this:

### Step 1: Go to Service Settings
1. Click on your backend service
2. Click **"Settings"** tab

### Step 2: Scroll Down
1. Scroll down in the Settings page
2. Look for a **"Storage"** or **"Volumes"** section
3. Click **"Add Volume"** or **"New Volume"**

### Step 3: Add Mount Path
1. Enter Mount Path: `/app/data`
2. Click **"Create"**

---

## Method 3: Using Railway CLI (If Dashboard Doesn't Work)

If you have Railway CLI installed:

```bash
# List your services
railway service list

# Add a volume to your backend service
railway volume add --service backend --mount-path /app/data
```

---

## Verification: Check if Volume is Added

After adding the volume:

1. Go back to your service
2. Click **"Settings"** tab
3. Scroll down to find **"Volumes"** section
4. You should see your volume listed with:
   - Mount Path: `/app/data`
   - Status: Active or Connected

---

## What Happens Next?

Once the volume is added:
1. Your service will **redeploy** automatically
2. The database file will be stored at `/app/data/crankshaft.db`
3. Uploaded files will be stored at `/app/data/uploads`
4. Data will **persist** even after restarts

---

## Troubleshooting

### "I don't see a Volumes tab"
- Try refreshing the page (F5)
- Try a different browser
- Use Method 3 (CLI) instead

### "Volume creation failed"
- Check if you have enough storage quota
- Try again in a few minutes
- Contact Railway support

### "Volume is not persisting data"
- Verify environment variables are set:
  - `DATABASE_PATH=/app/data/crankshaft.db`
  - `UPLOAD_DIR=/app/data/uploads`
- Check if the volume is actually mounted (Settings → Volumes)
- Restart the service

---

## Quick Reference

| Item | Value |
|------|-------|
| Mount Path | `/app/data` |
| Database Location | `/app/data/crankshaft.db` |
| Uploads Location | `/app/data/uploads` |
| Size | 5GB (default) |

---

## Next Steps

After adding the volume:
1. ✅ Volume added
2. → Verify environment variables are set
3. → Redeploy backend
4. → Add frontend service
5. → Deploy frontend
6. → Update CORS settings
7. → Test everything
