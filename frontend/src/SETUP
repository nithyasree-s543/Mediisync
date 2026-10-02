# 🖥️ VS Code Step-by-Step Setup (Complete Beginner Guide)

## Step 0: Prerequisites
Install:
- Node.js v18+ from https://nodejs.org (LTS)
- VS Code from https://code.visualstudio.com
- Git from https://git-scm.com

Verify in terminal (VS Code → Terminal → New Terminal):
```
node -v
npm -v
git -v
```

## Step 1: Open Project in VS Code
1. Download / Clone medisync folder
2. VS Code → File → Open Folder → Select `medisync`
3. You should see `backend` and `frontend` folders in Explorer (left side)

## Step 2: Setup Backend
1. In VS Code, Terminal → New Terminal
2. Type:
```bash
cd backend
npm install
```
Wait 1-2 mins.

3. Create env file:
- In Explorer, right-click `backend` folder → New File → `.env`
- Copy content from `.env.example` into `.env`
- Save (Ctrl+S)

4. Run backend:
```bash
npm run dev
```
You should see:
```
🩺 MediSync Backend running on http://localhost:5000
🔐 End-to-End Encryption: ENABLED
```

**Keep this terminal running!** Don't close.

## Step 3: Setup Frontend (New Terminal)
1. Terminal → New Terminal (click + icon to create second terminal)
2. Type:
```bash
cd frontend
npm install
```
Wait 1-2 mins.

3. Run frontend:
```bash
npm run dev
```
You should see:
```
VITE v5.4.0 ready in 300ms
Local: http://localhost:5173
```

4. Ctrl+Click on http://localhost:5173 → Opens in browser

## Step 4: Test the App
1. Landing page opens → Click "Get Started Free"
2. Register:
   - Name: Test Doctor
   - Email: test@medisync.com
   - Password: test123
   - Role: Doctor
   - Language: English (or Hindi/Tamil etc)
   - Click Create Account

3. You go to Dashboard → See:
   - Upload zone
   - Timeline empty
   - Conflicts 0

4. Test Upload:
   - Create a text file `prescription.txt` with content:
```
Dr. Kumar
City Hospital
Date: 20/09/2024
Diagnosis: Fever
Medicines: Paracetamol 500mg twice daily, Azithromycin 250mg
Tests: CBC, Blood Sugar 98 mg
```
   - Drag that file into upload zone
   - Wait 2-3 seconds → It processes
   - See Timeline appear with medicines, diagnosis
   - Click View Details → See extracted info → Verify

5. Test Multilingual:
   - Top right → Click language selector → Choose Hindi (हिन्दी)
   - Whole UI changes to Hindi!
   - Try Tamil, Telugu etc.

6. Test Encryption:
   - Notice 🔒 End-to-End Encrypted badges everywhere
   - Check backend/data/records.json → You will see encrypted text (hex strings), not plain text

## Step 5: VS Code Debugging Tips
- If backend fails: Check `.env` exists, PORT 5000 not used by other app
- If frontend fails: Check `VITE_API_URL` in frontend/.env is http://localhost:5000
- To kill process: Ctrl+C in terminal
- To see API: Open http://localhost:5000/api/health in browser

## Step 6: Project Structure in VS Code Explorer
```
medisync/
├── backend/
│   ├── server.js ← Main server file
│   ├── .env ← Your secrets (don't share)
│   ├── routes/ ← API logic
│   └── data/ ← Auto-created, holds users & records
├── frontend/
│   ├── src/
│   │   ├── pages/ ← Landing, Login, Dashboard
│   │   ├── i18n/ ← 8 languages
│   │   └── index.css ← All styling
│   └── .env ← API URL
├── README.md ← Full docs
├── DEPLOYMENT.md ← GitHub + Live deploy
└── SETUP_VSCODE.md ← This file
```

## Step 7: Next - Push to GitHub & Deploy Live
Follow `DEPLOYMENT.md` Part 2 & 3.

---

**You are done!** You now have full-stack MediSync running locally in VS Code.
