# Railway Dashboard Navigation Guide

## Finding the Volumes Section

### Location 1: Service Page - Storage Tab
```
Railway Dashboard
    ↓
Your Project
    ↓
Backend Service
    ↓
Tabs: [Overview] [Settings] [Variables] [Logs] [Storage] ← Click here
    ↓
Click "New Volume" or "Add Volume"
```

### Location 2: Service Settings - Scroll Down
```
Railway Dashboard
    ↓
Your Project
    ↓
Backend Service
    ↓
Click "Settings" tab
    ↓
Scroll down to "Storage" or "Volumes" section
    ↓
Click "Add Volume"
```

---

## Step-by-Step Screenshots Description

### Step 1: Open Your Project
- Go to https://railway.app
- You'll see your projects listed
- Click on "cranckshaft_detection_automation" project

### Step 2: Select Backend Service
- Inside the project, you'll see services
- Click on the service that says "backend" or has a Python icon
- This opens the service details page

### Step 3: Look for Storage/Volumes
The service page has several tabs at the top:
```
┌─────────────────────────────────────────────────────┐
│ Overview │ Settings │ Variables │ Logs │ Storage │ │
└─────────────────────────────────────────────────────┘
                                        ↑
                                   Click here
```

If you don't see "Storage" tab:
- Click the "..." (three dots) menu
- Look for "Storage" or "Volumes" option

### Step 4: Create New Volume
You'll see a button that says:
- "New Volume" or
- "Add Volume" or
- "+ Add Storage"

Click it.

### Step 5: Fill in the Form
A form will appear with fields:
```
┌──────────────────────────────────────┐
│ Mount Path: [/app/data]              │
│ Size: [5 GB] (optional)              │
│                                      │
│ [Create] [Cancel]                    │
└──────────────────────────────────────┘
```

- **Mount Path**: Type `/app/data`
- **Size**: Leave as default (5GB is fine)
- Click **Create**

### Step 6: Verify Volume Created
After creation, you should see:
```
Volumes
├── /app/data (5 GB)
│   └── Status: Active
```

---

## Alternative: Using Railway CLI

If the dashboard is confusing, use the command line:

### Install Railway CLI
```bash
npm install -g @railway/cli
```

### Login
```bash
railway login
```

### Add Volume
```bash
# First, list your services to get the service ID
railway service list

# Then add volume (replace SERVICE_ID with actual ID)
railway volume add --service SERVICE_ID --mount-path /app/data
```

---

## Common Issues & Solutions

### Issue: Can't find Storage/Volumes tab
**Solution:**
1. Refresh the page (Ctrl+F5)
2. Try a different browser
3. Use the CLI method above

### Issue: "Add Volume" button is grayed out
**Solution:**
1. Make sure you're on a paid plan (free tier has limited storage)
2. Check if you have storage quota remaining
3. Try again in a few minutes

### Issue: Volume not showing after creation
**Solution:**
1. Refresh the page
2. Go to Settings tab and scroll down
3. The volume might be listed there instead

---

## After Adding Volume

Your service will automatically redeploy with the volume mounted.

Check the deployment:
1. Go to **Logs** tab
2. Look for messages like:
   - "Volume mounted at /app/data"
   - "Application started successfully"

If you see errors, check:
1. Environment variables are set correctly
2. Database path is `/app/data/crankshaft.db`
3. Upload directory is `/app/data/uploads`

---

## Next: Set Environment Variables

After adding the volume, make sure these variables are set in the **Variables** tab:

```
DATABASE_PATH=/app/data/crankshaft.db
UPLOAD_DIR=/app/data/uploads
```

Then redeploy the service.
