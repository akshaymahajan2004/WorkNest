# Nexus EMS — Complete Pre-Deployment & Cloud Go-Live Guide

This document is your **single comprehensive manual** for taking the Nexus Enterprise Employee Management System (EMS) from your local computer to a live, production cloud deployment.

It covers:
1. **Exact code and configuration changes** needed in your current files before deploying.
2. **Step-by-step walkthrough from zero to live**:
   - Initializing Git & pushing to GitHub
   - Setting up a cloud PostgreSQL database on **Supabase** (or **AWS RDS**)
   - Deploying the backend API on **Render** (or **AWS App Runner**)
   - Deploying the frontend on **Vercel**
   - Connecting them together and testing the live application

---

## 🛠️ PART 1: What Things to Change in the Project Before Deploying

Before deploying to the cloud, you need to make **4 specific changes/checks** across your codebase.

---

### Change 1: Update Frontend API URL to Support Cloud Backends
- **File**: `frontend/src/services/api.ts` (Line 1)
- **Why**: Currently, `BASE_URL = '/api'` works locally because Vite proxies `/api` to `localhost:5000`. But when your frontend is hosted on Vercel (`https://your-ems.vercel.app`) and backend is on Render (`https://your-api.onrender.com`), the browser needs to send requests to your Render URL.
- **Change line 1 in `frontend/src/services/api.ts` to**:
  ```typescript
  // Replace:
  const BASE_URL = '/api';

  // With:
  const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
  ```
  > **How this works**:
  > - **Locally**: If `VITE_API_URL` is not set, it defaults to `/api` (local Vite proxy works as normal).
  > - **On Vercel**: You will set `VITE_API_URL = https://your-backend.onrender.com/api` in Vercel's settings, and the frontend will automatically connect to your live backend.

---

### Change 2: Ensure Vercel SPA Routing Configuration Exists
- **File**: `frontend/vercel.json`
- **Why**: Single Page Applications (SPAs) like React handle routing inside the browser. If a user on Vercel refreshes `/employees`, `/attendance`, or `/payroll`, Vercel's server will return a `404 Not Found` unless instructed to redirect all requests to `/index.html`.
- **Ensure `frontend/vercel.json` contains**:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

---

### Change 3: Enable Dynamic CORS in Backend
- **File**: `backend/src/app.ts` (Lines 19–22)
- **Why**: By default, browsers block cross-origin requests from `https://your-ems.vercel.app` to `https://your-api.onrender.com` unless CORS allows the Vercel domain.
- **Ensure `backend/src/app.ts` has**:
  ```typescript
  // In backend/src/app.ts:
  app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
  }));
  ```
  *(This automatically accepts requests from localhost, your Vercel URL, and any custom domain).*

---

### Change 4: Verify Root `.gitignore` is in Place
- **File**: `.gitignore` (in `e:\EMS\.gitignore`)
- **Why**: You must **never** commit `backend/.env` (contains private DB passwords and secrets), `node_modules` (hundreds of MBs), or `dist/` build artifacts to GitHub.
- **Ensure root `.gitignore` contains**:
  ```gitignore
  node_modules/
  **/node_modules/
  dist/
  **/dist/
  .env
  backend/.env
  *.log
  .DS_Store
  Thumbs.db
  ```

---

## 🚀 PART 2: End-to-End Deployment Walkthrough (From Git Init to Live)

Follow these steps in exact order:

```mermaid
graph LR
    Step1["1. Git Init & Push<br/>to GitHub"] --> Step2["2. Cloud DB<br/>(Supabase / RDS)"]
    Step2 --> Step3["3. Backend API<br/>(Render / AWS)"]
    Step3 --> Step4["4. Frontend<br/>(Vercel)"]
    Step4 --> Step5["5. Live App<br/>& Verification"]
```

---

### Step 1: Initialize Git and Push to GitHub

1. Open PowerShell in the project root (`e:\EMS`):
   ```powershell
   cd e:\EMS
   ```

2. Initialize Git repository:
   ```powershell
   git init
   ```

3. Stage and commit all project files:
   ```powershell
   git add .
   git commit -m "feat: complete Enterprise EMS full-stack application"
   ```

4. Create a repository on GitHub:
   - Go to [github.com/new](https://github.com/new).
   - **Repository name**: `nexus-ems` (or any name you prefer).
   - **Visibility**: Public or Private.
   - **Do NOT check** "Add a README file" or ".gitignore" (we already have them).
   - Click **Create repository**.

5. Link your local repo and push:
   ```powershell
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/nexus-ems.git
   git push -u origin main
   ```

---

### Step 2: Create Cloud Database & Push Schema (Supabase)

We recommend **Supabase** because it is free, fast, and provides managed PostgreSQL 16.

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and log in.
   - Click **New Project**.
   - **Name**: `nexus-ems-db`
   - **Database Password**: Choose a strong password and **copy it down**.
   - **Region**: Pick the region closest to you (e.g. *US East*, *Central EU*, or *Singapore*).
   - Click **Create new project** and wait ~2 minutes for it to be ready.

2. **Copy the Connection String**:
   - In Supabase, click the **Settings** (gear icon in left sidebar) ➔ **Database**.
   - Scroll down to **Connection string** ➔ select the **URI** tab.
   - Select **Mode: Session** (port 5432):
     ```text
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres?sslmode=require
     ```
   - Replace `[YOUR-PASSWORD]` with the database password you created in step 2.1.
   - **Copy this full string.**

3. **Migrate Schema & Seed Data to Supabase from your local terminal**:
   Run this in PowerShell on your computer:
   ```powershell
   cd e:\EMS\backend

   # Set your live Supabase connection string for this session:
   $env:DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres?sslmode=require"

   # 1. Push all database tables to Supabase
   npx prisma db push

   # 2. Seed realistic company settings, departments, employees, attendance, and payroll records
   npm run prisma:seed
   ```
   > You will see `✅ Seeding completed successfully!` printed in your terminal.
   > You can open Supabase ➔ **Table Editor** to visually verify that all tables (`User`, `Employee`, `Department`, `Attendance`, `PayrollRecord`) are populated!

---

### Step 3: Deploy Backend API (Render)

1. **Create Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) and log in with GitHub.
   - Click **New +** (top right) ➔ **Web Service**.
   - Choose your `nexus-ems` GitHub repository.

2. **Configure Service Settings**:
   - **Name**: `nexus-ems-backend`
   - **Region**: Same region as your Supabase database (e.g., *Oregon* or *Frankfurt*).
   - **Branch**: `main`
   - **Root Directory**: `backend`  *(⚠️ CRITICAL: Must type `backend`)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```bash
     node dist/index.js
     ```

3. **Add Environment Variables**:
   Click **Advanced** or scroll to **Environment Variables**, then add:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your full Supabase connection string from Step 2.2 |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `JWT_SECRET` | `super-secure-ems-jwt-production-secret-key-2026-xyz` |
   | `JWT_EXPIRES_IN` | `7d` |

4. **Deploy**:
   - Click **Create Web Service**.
   - Render will build the TypeScript files and start the Express server.
   - Once deployment completes, you will see:  
     `🚀 Enterprise EMS Backend server is running on port 5000`
   - Copy your live backend URL (e.g., `https://nexus-ems-backend.onrender.com`).

5. **Test Backend**:
   Open in your browser:
   👉 **`https://nexus-ems-backend.onrender.com/api/health`**  
   It should return:
   ```json
   { "status": "healthy", "service": "Enterprise EMS API" }
   ```

---

### Step 4: Deploy Frontend Client (Vercel)

1. **Import Project to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in with GitHub.
   - Click **Add New...** ➔ **Project**.
   - Find and click **Import** next to `nexus-ems`.

2. **Configure Project Settings**:
   - **Project Name**: `nexus-ems`
   - **Framework Preset**: `Vite` *(auto-detected)*
   - **Root Directory**: Click **Edit** ➔ select `frontend` *(⚠️ CRITICAL: Must select `frontend`)*
   - **Build and Output Settings**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. **Add Environment Variable**:
   Under **Environment Variables**, add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://nexus-ems-backend.onrender.com/api` *(Your Render URL followed by `/api`)*

4. **Deploy**:
   - Click **Deploy**.
   - In ~45 seconds, your app will be live with free global CDN and HTTPS!
   - Your live site will be at:  
     👉 **`https://nexus-ems.vercel.app`**

---

### Step 5: Test and Verify the Live Deployment

Visit your live Vercel URL: **`https://nexus-ems.vercel.app`**

1. **Log In with Pre-Seeded Accounts**:
   Click the **1-Click Demo Account** buttons or enter:
   - **Admin**: `admin@enterprise-ems.com` / `Admin@123`
   - **HR Manager**: `hr@enterprise-ems.com` / `Hr@123`
   - **Employee**: `john.doe@enterprise-ems.com` / `Emp@123`

2. **Test Key Live Features**:
   - **Attendance Widget**: Click **Punch In** in topbar; see your check-in timestamp save to Supabase.
   - **Dashboard**: See live employee counts and 7-day attendance trends.
   - **Employee Directory**: Search employees by name, filter by department, open profile modal.
   - **Leave Management**: Submit a leave request; log in as Admin/HR to approve it.
   - **Payroll**: Generate payroll and inspect printable pay slips.
   - **Reports**: Open **Reports** and click **Export CSV**; confirm the file downloads.

---

## ☁️ Alternative: AWS Deployment (AWS RDS + AWS App Runner)

If your organization requires deployment entirely within AWS:

### 1. Database on AWS RDS (PostgreSQL)
1. Go to AWS Console ➔ **Amazon RDS** ➔ **Create Database**.
2. Engine: **PostgreSQL 16**.
3. Template: **Free Tier** (`db.t4g.micro`).
4. Master username: `postgres`, set password.
5. In *Connectivity*, set **Public access: Yes** and configure Security Group to allow inbound TCP on port `5432`.
6. Database name under *Additional Configuration*: `ems_db`.
7. Connection URL format:
   ```text
   postgresql://postgres:[PASSWORD]@[YOUR-ENDPOINT].rds.amazonaws.com:5432/ems_db?sslmode=require
   ```

### 2. Backend on AWS App Runner
1. In AWS Console, go to **AWS App Runner** ➔ **Create Service**.
2. Source: **Source code repository** ➔ Connect GitHub ➔ `nexus-ems`.
3. Build Settings:
   - Configuration file: *Configure all settings here*
   - Runtime: `Node.js 18` or `Node.js 20`
   - Build command: `cd backend && npm install && npx prisma generate && npm run build`
   - Start command: `cd backend && node dist/index.js`
   - Port: `5000`
4. Environment Variables:
   - `DATABASE_URL`: Your AWS RDS URL
   - `JWT_SECRET`: Your production secret
   - `NODE_ENV`: `production`
5. App Runner provides a live HTTPS URL (e.g. `https://xyz.us-east-1.awsapprunner.com`).
6. In Vercel, set `VITE_API_URL = https://xyz.us-east-1.awsapprunner.com/api`.

---

## 💡 Important Production Maintenance Tips

1. **Render Free Tier Spin-Down**:
   On the free tier, Render sleeps after 15 minutes of inactivity. The first request after sleep takes ~30 seconds to wake up.
   - **Free Fix**: Set up a free monitor at [UptimeRobot.com](https://uptimerobot.com) to ping `https://your-backend.onrender.com/api/health` every 10 minutes. This keeps your backend active 24/7 at no cost.

2. **Custom Domains**:
   - **Frontend**: In Vercel ➔ **Settings** ➔ **Domains**, add `ems.yourcompany.com` and add the `CNAME` record in your DNS provider.
   - **Backend**: In Render ➔ **Settings** ➔ **Custom Domains**, add `api.yourcompany.com`.

3. **Subsequent Code Updates**:
   Once connected, any `git push origin main` will **automatically trigger**:
   - Render to rebuild and redeploy the backend.
   - Vercel to rebuild and redeploy the frontend with zero downtime.
