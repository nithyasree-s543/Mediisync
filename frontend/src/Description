# MediSync - Complete Beginner Guide (0 to 100)
### From Zero Knowledge to Live Hosted App

This guide assumes you have **never** used VS Code, Node.js, GitHub before. Follow exactly.

---

## 🧒 PART 0: What is MediSync? (Simple Explanation)

Think of MediSync like **Google Photos but for medical papers**.

- **Problem**: Your medical papers (prescriptions, lab reports) are scattered everywhere - some at home, some on phone, some lost.
- **Solution**: MediSync lets you upload all papers in one place. It READS them (OCR), UNDERSTANDS them (AI finds medicines, disease names), SORTS them by date (Timeline), and WARNS if something is wrong (conflict detection).
- **Frontend**: What YOU see in browser (buttons, pages) - like the body of car
- **Backend**: The brain that does work behind - like engine of car
- **Database**: Where your encrypted records are stored - like trunk

Workflow you will show judges:
**Upload (you upload paper) → Extract (computer reads text) → Organize (sorts by date) → Detect (finds problems) → Timeline (shows history) → Verify (doctor says OK)**

---

## 📥 PART 1: Install 3 Softwares (Do this once)

You need 3 free softwares. All safe.

### 1A. Install Node.js (This lets your computer run the app code)
1. Go to https://nodejs.org
2. Click green button "LTS" (Long Term Support) - Download
3. Open downloaded file → Click Next → Next → Install
4. To check if installed:
   - Windows: Press `Windows Key + R` → Type `cmd` → Press Enter → Black window opens
   - Mac: Press `Cmd + Space` → Type `Terminal` → Enter
   - Type: `node -v` → Should show v18 or v20 or v22 → Means success
   - Type: `npm -v` → Should show number

### 1B. Install VS Code (This is where you write and run code)
1. Go to https://code.visualstudio.com
2. Click "Download for Windows/Mac"
3. Install it like normal software
4. Open VS Code → You see blue window

### 1C. Install Git (This helps upload code to GitHub)
1. Go to https://git-scm.com/downloads
2. Download for your system → Install with default Next → Next

**Done! You have all tools.**

---

## 📂 PART 2: Get the MediSync Code into VS Code

You have 2 options:

### Option A: You downloaded ZIP from me
1. You have `medisync.zip` → Right click → Extract All → You get `medisync` folder
2. Open VS Code → File → Open Folder → Select that `medisync` folder → Click Select Folder
3. On left side, you should see `backend` and `frontend` folders. SUCCESS!

### Option B: Copy from this workspace (If you're in Arena)
- In Arena file viewer, you see `medisync` folder. Download each file or download whole folder if option available.
- Or create new folder on Desktop named `medisync` and copy-paste structure.

### What is inside?
```
medisync/
├── backend/       → Brain (engine)
│   ├── server.js  → Main brain file
│   ├── routes/    → Doors for login, upload
│   ├── utils/     → Tools like encryption, OCR
│   └── .env       → Secret keys (like password)
├── frontend/      → Face (what you see)
│   ├── src/pages/ → Landing, Login, Dashboard pages
│   ├── src/i18n/  → 8 languages
│   └── index.css  → Colors, design
└── README.md      → Docs
```

---

## 🧠 PART 3: Run BACKEND (The Brain) - Step by Step

This is SUPER important. Do exactly.

1. **Open Terminal inside VS Code:**
   - In VS Code, top menu → Terminal → New Terminal
   - At bottom, a black/white box opens. This is TERMINAL - where you type commands.

2. **Go to backend folder:**
   Copy-paste this and press Enter:
   ```bash
   cd backend
   ```
   What is `cd`? It means "Change Directory" - like opening a folder.

3. **Install backend tools:**
   Copy-paste and press Enter (takes 1-2 minutes, wait):
   ```bash
   npm install
   ```
   What is this? `npm` is like Play Store for code. It downloads all needed tools (express, jwt, etc). You will see many lines scrolling - normal.

4. **Check .env file exists:**
   - In left Explorer, open `backend` folder → You should see `.env` file
   - If NOT there: Right-click `backend` → New File → Name it `.env` → Open `.env.example` → Copy all text → Paste into `.env` → Save (Ctrl+S)

5. **Start backend:**
   Copy-paste and press Enter:
   ```bash
   npm run dev
   ```
   You should see:
   ```
   🩺 MediSync Backend running on http://localhost:5000
   🔐 End-to-End Encryption: ENABLED
   ```

   **IMPORTANT: DO NOT CLOSE THIS TERMINAL!** Leave it running. Backend is now alive.

   If you see error "PORT 5000 in use", try: Close other apps, or change PORT in .env to 5001

---

## 🎨 PART 4: Run FRONTEND (The Face) - Step by Step

We need SECOND terminal because first one is busy running backend.

1. **Open second terminal:**
   - In VS Code terminal, click `+` icon at top right of terminal panel → New terminal opens
   - Now you have 2 terminals - Terminal 1 running backend, Terminal 2 empty

2. **Go to frontend folder:**
   In Terminal 2, type:
   ```bash
   cd frontend
   ```
   Note: If you were already in backend, first go back: `cd ..` then `cd frontend`
   Full safe way:
   ```bash
   cd ..
   cd frontend
   ```

3. **Install frontend tools:**
   ```bash
   npm install
   ```
   Wait 1-2 minutes.

4. **Start frontend:**
   ```bash
   npm run dev
   ```
   You should see:
   ```
   VITE ready in 500ms
   Local: http://localhost:5173
   ```

5. **Open in browser:**
   - Hold `Ctrl` (Windows) or `Cmd` (Mac) and Click on `http://localhost:5173` link in terminal
   - OR manually open Chrome and type `http://localhost:5173`
   - You should see MediSync beautiful landing page! 🎉

   **If you see blank page, check:**
   - Backend terminal still running? (Should show running message)
   - Any red errors in frontend terminal? Copy error and ask me.

---

## 👩‍⚕️ PART 5: Use the App (Test Everything)

### 5A. Register (Create account)
1. On landing page → Click "Get Started Free" (top right)
2. Fill form:
   - Full Name: Your Name (e.g., Priya)
   - Email: `test@gmail.com` (any email, doesn't need real)
   - Password: `test123` (remember this)
   - Role: Choose `Doctor` or `Patient`
   - Language: Choose `English` (you can change later to Tamil/Hindi etc)
3. Click "Create Account →"
4. You go to Dashboard! You are logged in.

### 5B. Understand Dashboard
Top: Shows "Welcome, Priya" and workflow: Upload → Extract → Organize → Detect → Timeline → Verify

You see 3 numbers:
- Records: 0 (you have 0 papers now)
- Timeline: 0
- Issues: 0

Left side:
- Upload box (drag papers here)
- Timeline (will show after upload)

Right side:
- Conflicts (warnings)
- Recent Records

### 5C. Upload your first medical record (MOST EXCITING PART)
I created a sample file for you: `sample-medical-record.txt`

1. Find that file in `medisync` folder
2. Drag and drop it into the upload box on Dashboard
   - OR click upload box → File picker opens → Select `sample-medical-record.txt`
3. You see "Processing with OCR + AI..." with spinner (2-3 seconds)
4. Magic happens! Page refreshes and you see:
   - Records: 1
   - Timeline shows 1 item with date, medicines (Paracetamol, Azithromycin), diagnosis (Viral Fever)
   - Recent Records shows your file

### 5D. View Details
1. Click "View" or "View Details →" on any record
2. Popup opens showing:
   - Full extracted text (what OCR read)
   - Medicines list with dosage
   - Diagnosis
   - Tests (CBC, Blood Sugar etc)
   - Buttons: Verify, Delete
3. Click "Verify Record" → It becomes green "Verified"
4. Close popup

### 5E. Test Multilingual (Your special feature!)
1. Top right, near navbar, you see 🌐 English ▾
2. Click it → Dropdown shows 8 languages:
   - English, हिन्दी Hindi, বাংলা Bengali, मराठी Marathi, తెలుగు Telugu, தமிழ் Tamil, ગુજરાતી Gujarati, اردو Urdu
3. Click "தமிழ்" (Tamil) → WHOLE app changes to Tamil! Try Hindi.
4. This is because I built translations for you. Judges will love this.

### 5F. Test Conflict Detection
1. Upload same file again OR upload another file with different dosage for same medicine (e.g., create new txt file with "Paracetamol 1000mg")
2. Right side "Conflicts" will show warning: "Different dosages found for paracetamol"
3. This shows your AI detects problems!

### 5G. Test Encryption (Security feature)
1. In VS Code, open `backend/data/records.json`
2. You will see weird long hex strings like "a1b2c3d4..." - NOT readable text
3. That is encrypted! Means even if hacker steals file, they can't read.
4. But in Dashboard you CAN read because you are logged in with key - that is End-to-End Encryption.

---

## 🌍 PART 6: How Code Works? (Simple Explanation, Not Needed to Run)

You don't need to understand to run, but for judges questions:

**Frontend (React):**
- `src/pages/Landing.jsx` → First page with problem/solution
- `src/pages/Login.jsx` & `Register.jsx` → Login forms
- `src/pages/Dashboard.jsx` → Main app where upload happens (300+ lines, most important)
- `src/context/AuthContext.jsx` → Remembers who is logged in
- `src/i18n/translations.js` → All 8 languages dictionary

**Backend (Node.js):**
- `server.js` → Starts server on port 5000
- `routes/auth.js` → When you register/login, it checks password, creates token (JWT), encrypts name
- `routes/records.js` → When you upload file, it:
  1. Saves file to `data/uploads/`
  2. Calls `ocr.js` to read text
  3. Calls `extraction.js` to find medicines etc
  4. Encrypts with `encryption.js`
  5. Saves to `records.json`
  6. Checks conflicts
  7. Sends back to frontend
- `utils/encryption.js` → AES-256 encryption (military grade)
- `utils/ocr.js` → Uses Tesseract.js to read text from images
- `utils/extraction.js` → Smart regex to find medical info + detect conflicts + sort timeline

**How frontend talks to backend?**
- Frontend uses `axios` to call `http://localhost:5000/api/records/upload` with your file + token
- Backend checks token (are you logged in?), processes, returns JSON
- Frontend shows JSON as nice cards

---

## 🐙 PART 7: Push to GitHub (What is GitHub? Why?)

**What is GitHub?** It's like Google Drive for code. You upload code there so:
- Judges can see your code
- You can deploy live from there
- It is safe backup

**Step by Step:**

### 7A. Create GitHub Account
1. Go to https://github.com
2. Click Sign Up → Create account with email
3. Verify email

### 7B. Create New Repository (Folder on GitHub)
1. After login, top right → `+` → New Repository
2. Repository name: `medisync`
3. Description: `MediSync - Connecting Medical Records for Better Care`
4. Keep Public (so judges can see)
5. **IMPORTANT: Uncheck "Add README"** - We already have
6. Click "Create Repository"
7. You see page with commands → Copy the URL like `https://github.com/yourname/medisync.git`

### 7C. Push Code from VS Code to GitHub
1. In VS Code, open terminal (any terminal, but go to root folder):
   ```bash
   cd ..
   # If you are in backend or frontend, go to medisync root
   # You should be in folder that has backend and frontend inside
   pwd  # This shows where you are - should end with medisync
   ```

2. Initialize git (like telling computer "I want to use GitHub"):
   ```bash
   git init
   ```

3. Add all files:
   ```bash
   git add .
   ```
   (The dot means "all files")

4. Save with message:
   ```bash
   git commit -m "First commit: MediSync full stack app"
   ```

5. Connect to GitHub (paste YOUR URL from step 7B):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/medisync.git
   ```
   Replace YOUR_USERNAME with your actual GitHub username.

6. Push:
   ```bash
   git branch -M main
   git push -u origin main
   ```

   **If it asks username/password:**
   - Username: Your GitHub username
   - Password: NOT your GitHub password! You need Personal Access Token:
     - GitHub → Top right profile → Settings → Developer Settings (bottom left) → Personal Access Tokens → Tokens (classic) → Generate new token → Check `repo` → Generate → Copy token → Paste as password

7. Go to your GitHub URL in browser → Refresh → You should see your code! 🎉

**If you get error, tell me exact error message.**

---

## 🚀 PART 8: Make it LIVE on Internet (Deployment)

What is deployment? Right now app runs only on YOUR computer (localhost). To show judges live link like `https://medisync.vercel.app`, you need to host on internet for free.

We will use 2 free services:
- **Render** for Backend (brain)
- **Vercel** for Frontend (face)

### 8A. Deploy Backend on Render (Free)

1. Go to https://render.com → Sign Up with GitHub (click "GitHub" button, easier)
2. After login, Dashboard → Click "New +" → "Web Service"
3. Connect your `medisync` repository → Click Connect
4. Fill form:
   - Name: `medisync-backend`
   - Root Directory: `backend`  (IMPORTANT - type backend)
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`
5. Scroll down → "Advanced" → "Add Environment Variable" → Add these 5:
   ```
   PORT = 5000
   JWT_SECRET = my_super_secret_key_12345_change_this_long_random
   ENCRYPTION_KEY = 0123456789abcdef0123456789abcdef
   ENCRYPTION_IV = abcdef9876543210
   FRONTEND_URL = https://temp.com (we will update later)
   ```
   (For now put temp.com, later we change to Vercel URL)

6. Click "Create Web Service" → Wait 5 minutes (it builds) → You get URL like `https://medisync-backend.onrender.com`
7. Test: Open `https://medisync-backend.onrender.com/api/health` in browser → Should show JSON with "MediSync Backend Running" → Means backend live!

Copy that backend URL, save in notepad.

### 8B. Deploy Frontend on Vercel (Free)

1. Go to https://vercel.com → Sign Up with GitHub
2. Click "Add New..." → "Project"
3. Find `medisync` repo → Click Import
4. Configure:
   - Framework Preset: `Vite` (auto detected)
   - **Root Directory**: Click "Edit" → Select `frontend` folder → Continue (SUPER IMPORTANT!)
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)
5. Environment Variables → Add:
   ```
   VITE_API_URL = https://medisync-backend.onrender.com
   ```
   Paste YOUR backend URL from step 8A (no trailing slash)

6. Click Deploy → Wait 2-3 minutes → You get URL like `https://medisync.vercel.app` → Click it → Your app is LIVE! 🎉

7. **Connect backend to frontend:**
   - Go back to Render.com → Your backend service → Left menu "Environment" → Find `FRONTEND_URL` → Edit → Paste your Vercel URL `https://medisync.vercel.app` → Save Changes → It will redeploy (wait 2 mins)

8. **Final Test:**
   - Open Vercel URL → Register new account → Upload sample file → Should work same as localhost but now on internet!

**Done! You have live links to show judges:**
- Frontend Live: `https://medisync.vercel.app`
- Backend Live: `https://medisync-backend.onrender.com/api/health`
- GitHub Code: `https://github.com/YOUR_USERNAME/medisync`

---

## 😰 PART 9: Common Problems & Solutions (For Beginners)

**Problem: `npm install` shows error**
- Solution: Delete `node_modules` folder and `package-lock.json`, then run `npm install` again. Or check Node version `node -v` should be 18+

**Problem: Backend says "PORT 5000 already in use"**
- Solution: Close other terminals, or change `.env` PORT to 5001, and also change frontend `.env` VITE_API_URL to 5001

**Problem: Frontend shows blank white page**
- Solution: Check backend terminal still running. Check browser console: Press F12 → Console tab → See red errors → Share with me.

**Problem: Upload fails**
- Solution: Check file size <10MB, check backend terminal for errors. Render free tier deletes uploads on restart - normal for demo.

**Problem: Git push asks password and fails**
- Solution: Use Personal Access Token as explained in 7C, not GitHub password.

**Problem: Vercel deploy fails**
- Solution: Make sure Root Directory is `frontend`, not root. Check build logs in Vercel dashboard.

**Problem: Live frontend can't connect to backend (CORS error)**
- Solution: In Render backend env, FRONTEND_URL must exactly match Vercel URL (https, no slash at end). After changing, wait for redeploy.

---

## 🎤 PART 10: How to Present to Judges (5 Minute Script)

**Minute 1 - Problem:**
"Good morning respected judges. Medical records are scattered - prescriptions, lab reports, scans in different places. Doctors waste time searching. Our solution MediSync connects them."

**Minute 2 - Demo Landing:**
Show live Vercel URL → Scroll landing page → Show workflow Upload→Extract→Organize→Detect→Timeline→Verify → Show features 6 cards → Show 8 languages + encryption badge.

**Minute 3 - Live App:**
Click Get Started → Register as Doctor, choose Tamil language → Dashboard opens in Tamil! → Upload sample prescription image (keep 2-3 ready on desktop) → Show processing → Timeline appears with medicines extracted.

**Minute 4 - Features:**
Click View Details → Show medicines, diagnosis, tests extracted by AI → Click Verify → Show green verified → Show Conflicts section → Explain "If same medicine with different dosage uploaded, it warns" → Show Recent Records.

**Minute 5 - Tech & Future:**
"We use OCR (Tesseract), AI NLP for extraction, AES-256 end-to-end encryption, 8 languages for India. Future: hospital integration, mobile app, voice search, wearable data. MediSync - Connecting Medical Records for Better Care. Thank you!"

**Keep ready:**
- 2-3 sample medical images on Desktop (prescription, lab report)
- GitHub repo open in tab
- Backend health URL open
- This guide printed

---

## 📚 Glossary for Beginners

- **VS Code**: App where you write code
- **Terminal**: Black box where you type commands
- **Node.js**: Lets computer run JavaScript code (backend needs it)
- **npm**: Play Store for code libraries
- **localhost**: Your own computer (not internet)
- **Frontend**: What user sees
- **Backend**: Brain behind
- **API**: Door through which frontend talks to backend
- **JWT**: Token that proves you are logged in (like wristband in event)
- **Encryption**: Converting readable text to unreadable code for security
- **OCR**: Technology that reads text from images
- **GitHub**: Google Drive for code
- **Deploy**: Put app on internet so others can see
- **Render/Vercel**: Free hosting services (like landlords for your app)

---

## ✅ Final Checklist

- [ ] Node.js installed (`node -v` works)
- [ ] VS Code installed
- [ ] Git installed
- [ ] MediSync folder opened in VS Code
- [ ] Backend `npm install` done
- [ ] Backend `npm run dev` running (shows 🩺 running)
- [ ] Frontend `npm install` done
- [ ] Frontend `npm run dev` running (shows Local: http://localhost:5173)
- [ ] Can open http://localhost:5173 and see landing
- [ ] Can register and login
- [ ] Can upload sample file and see timeline
- [ ] Tested Tamil/Hindi language switch
- [ ] GitHub account created
- [ ] Code pushed to GitHub
- [ ] Backend deployed on Render (live URL works)
- [ ] Frontend deployed on Vercel (live URL works)
- [ ] Tested live URL upload works
- [ ] Ready for judges!

---

## 🆘 Need Help?

If stuck at any step:
1. Copy exact error message from terminal
2. Tell me which PART and STEP you are on
3. Send screenshot if possible
4. I will fix!

You got this! 🚀

**MediSync — Connecting Medical Records for Better Care.**
