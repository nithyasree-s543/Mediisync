# 🚀 Deployment Guide - GitHub + Live Hosting

This guide gives you **step-by-step VS Code to GitHub to Live URL**.

---

## PART 1: Setup in VS Code (Local)

### Step 1: Open VS Code
1. Open VS Code
2. File → Open Folder → Select `medisync` folder

### Step 2: Terminal Setup (VS Code Terminal: Ctrl+`)
```bash
# Check versions
node -v   # need v18+
npm -v

# Backend
cd backend
npm install
# Create env file
# On Windows: copy .env.example .env
# On Mac/Linux: cp .env.example .env
# Edit .env file with your secrets

# Frontend (open NEW terminal in VS Code)
cd frontend
npm install
```

### Step 3: Run Locally
**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Should show: MediSync Backend running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Should show: Local: http://localhost:5173
```

Open http://localhost:5173 → You should see MediSync landing page.

---

## PART 2: Push to GitHub (Step-by-Step)

### Step 1: Create GitHub Repo
1. Go to https://github.com → New Repository
2. Name: `medisync`
3. Description: `AI-assisted healthcare information management - Connecting Medical Records for Better Care`
4. Keep Public, **Don't** initialize with README (we already have)
5. Create Repository → Copy the URL like `https://github.com/YOUR_USERNAME/medisync.git`

### Step 2: Git Init in VS Code Terminal (root folder)
```bash
# Go to root medisync folder
cd /path/to/medisync   # or cd .. if you're in backend/frontend

git init
git add .
git commit -m "Initial commit: MediSync full stack - frontend backend with E2E encryption, multilingual, OCR, timeline"

# Add .gitignore (important!)
# Create .gitignore file in root:
```

**Create `medisync/.gitignore` file:**
```
# Dependencies
node_modules/
backend/node_modules/
frontend/node_modules/

# Env
backend/.env
backend/data/
frontend/.env

# Builds
frontend/dist/
backend/data/uploads/*

# Logs
*.log
.DS_Store

# Keep data folder structure but ignore contents
!backend/data/.gitkeep
```

```bash
# Then:
git add .gitignore
git commit -m "Add gitignore"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/medisync.git
git branch -M main
git push -u origin main
```

**If auth fails:** Use GitHub CLI or Personal Access Token:
- GitHub → Settings → Developer Settings → Personal Access Tokens → Generate Token (classic) → Check `repo` → Copy token → Use as password when pushing.

### Step 3: Verify on GitHub
- Go to your repo URL → You should see frontend/ backend/ README.md

---

## PART 3: Live Deployment (Free Hosting)

You have 2 services: Backend (Node) + Frontend (React). Deploy separately but connect via env.

### OPTION A: Easiest - Render.com (Backend) + Vercel (Frontend) - Recommended

#### Deploy Backend on Render (Free)
1. Go to https://render.com → Sign up with GitHub
2. Dashboard → New + → Web Service
3. Connect your `medisync` repo
4. Settings:
   - Name: `medisync-backend`
   - Root Directory: `backend`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance: Free
5. Add Environment Variables (Advanced → Add Env Var):
   ```
   PORT=5000
   JWT_SECRET=change_this_to_random_string_32_chars_long_secure
   ENCRYPTION_KEY=0123456789abcdef0123456789abcdef_change_this
   ENCRYPTION_IV=abcdef9876543210_change_this
   FRONTEND_URL=https://your-frontend-url.vercel.app  (you'll update after frontend deploy)
   ```
6. Click Create Web Service → Wait 3-5 mins → You'll get URL like `https://medisync-backend.onrender.com`
7. Test: Open `https://your-backend.onrender.com/api/health` → Should show JSON

#### Deploy Frontend on Vercel (Free)
1. Go to https://vercel.com → Sign up with GitHub
2. Add New → Project → Import `medisync` repo
3. Settings:
   - Framework Preset: Vite
   - Root Directory: `frontend`  (IMPORTANT - click Edit and select frontend folder)
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables:
   ```
   VITE_API_URL=https://medisync-backend.onrender.com   (your Render backend URL)
   ```
5. Deploy → Wait 2 mins → You'll get URL like `https://medisync.vercel.app`

6. **Connect them:**
   - Go back to Render → Your backend service → Environment → Update `FRONTEND_URL` to your Vercel URL → Save (will redeploy)

7. Done! Open your Vercel URL → Full app live!

### OPTION B: Both on Render (Simpler)
1. Deploy Backend as above on Render
2. Deploy Frontend as Static Site on Render:
   - New + → Static Site → Connect same repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Env Var: `VITE_API_URL=https://your-backend.onrender.com`

### OPTION C: Railway.app (Alternative)
- https://railway.app → New Project → Deploy from GitHub → Select repo → Add 2 services (backend and frontend)

---

## PART 4: After Deployment Checklist

1. **Test live:**
   - Open frontend URL → Register → Login → Upload a medical image/PDF → See timeline
2. **Update CORS:** Backend already allows `FRONTEND_URL` from env, so it should work.
3. **Custom Domain (Optional):** Vercel/Render → Settings → Domains → Add your domain
4. **Keep Render Awake:** Free tier sleeps after 15 mins. First request may take 30s to wake. For demo, open backend URL once before presentation.

---

## PART 5: VS Code Extensions Helpful

Install these in VS Code for better experience:
- ES7+ React/Redux/React-Native snippets
- Prettier
- Auto Rename Tag
- Thunder Client (for testing APIs inside VS Code)

---

## PART 6: How to Update Live App After Changes

```bash
# In VS Code, after you make changes:
git add .
git commit -m "Update: added new feature"
git push origin main

# Render and Vercel auto-deploy on push! (if connected)
# Check their dashboards for deploy logs
```

---

## 🎤 For Judges Demo - Quick Script

1. Show GitHub repo → Explain structure frontend/backend
2. Open Live URL (Vercel)
3. Show Landing page → Explain problem/solution
4. Register as Doctor (English) → Then switch language to Hindi/Tamil to show multilingual
5. Upload a sample prescription image (keep 2-3 sample images ready)
6. Show OCR extracting → Timeline building → Conflict detection
7. Click record → Show medicines/diagnosis/tests extracted → Verify button
8. Show encryption badge → Explain AES-256, end-to-end
9. Show workflow: Upload → Extract → Organize → Detect → Timeline → Verify

**Sample files to keep for demo:** Take photos of any medical prescription, lab report.

---

## 🆘 Common Issues & Fixes

**Backend not starting on Render:**
- Check logs → Usually missing env vars. Ensure PORT is set.
- Check package.json has "type": "module"

**Frontend API not connecting:**
- Ensure VITE_API_URL is set correctly in Vercel (must start with https, no trailing slash)
- Check backend CORS - FRONTEND_URL must match frontend URL exactly

**Upload fails:**
- Render free tier has ephemeral storage - uploads deleted on restart. For demo it's okay. For production, use AWS S3 or Cloudinary.
- To fix: Add Cloudinary integration (optional future)

**Tesseract OCR fails on Render:**
- It's heavy. Our code has fallback mock. For production, use Google Vision API.

---

## 📦 Final Deliverables for Submission

- GitHub Repo Link: `https://github.com/YOUR_USERNAME/medisync`
- Live Frontend URL: `https://medisync.vercel.app`
- Live Backend URL: `https://medisync-backend.onrender.com/api/health`
- Demo Video (optional): Record screen of workflow

---

Good luck! 🚀 **MediSync — Connecting Medical Records for Better Care.**
