# Nexus EMS — Setup & Installation Guide

This document provides a step-by-step walkthrough for configuring, installing dependencies, launching the database, seeding realistic workforce data, and running the **Nexus Enterprise Employee Management System (EMS)** locally on your machine.

---

## 📋 System Prerequisites

Before starting, ensure you have the following installed on your machine:

| Requirement | Recommended Version | Verification Command | Notes |
|---|---|---|---|
| **Node.js** | `v18.x`, `v20.x`, or `v22.x` | `node -v` | Active LTS recommended |
| **npm** | `v9.x` or `v10.x` | `npm -v` | Bundled with Node.js |
| **Docker Desktop** | Latest | `docker --version` | Must be running with Compose |
| **Terminal/Shell** | PowerShell or Bash | — | Windows PowerShell / Terminal |

---

## ⚡ Quick Start (TL;DR)

If you already have Docker and Node.js running, execute these commands:

```bash
# 1. Start PostgreSQL (Port 5433)
docker compose up -d

# 2. Setup & Run Backend (Terminal 1)
cd backend
npm install
npx prisma db push
npm run prisma:seed
npm run dev

# 3. Setup & Run Frontend (Terminal 2)
cd ../frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🛠️ Detailed Step-by-Step Installation

### Step 1: Start PostgreSQL via Docker

The project uses Docker Compose to run a containerized PostgreSQL 16 database. 

1. From the project root (`e:\EMS`):
   ```bash
   docker compose up -d
   ```

2. Confirm the database container is running:
   ```bash
   docker compose ps
   ```
   You should see `ems-postgres` in the `Up` state.

> [!NOTE]
> **Why Port 5433?**  
> The container forwards host port **`5433`** to container port `5432`. This avoids port collisions if you already have a local PostgreSQL instance running on default port `5432`.

---

### Step 2: Configure Environment Variables

The backend requires an `.env` file for database connection strings and JWT secrets.

1. Ensure `backend/.env` exists. If not, copy it from `.env.example`:
   ```bash
   # Windows PowerShell (from root directory):
   Copy-Item .env.example backend\.env

   # Linux / macOS:
   cp .env.example backend/.env
   ```

2. The default configuration in `backend/.env` is pre-configured for local development:
   ```env
   # Database Configuration (Docker PostgreSQL on port 5433)
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ems_db?schema=public"

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Authentication Secrets
   JWT_SECRET="super-secret-ems-jwt-key-change-in-production-2026"
   JWT_EXPIRES_IN="7d"

   # Frontend Client URL
   CLIENT_URL="http://localhost:5173"
   ```

---

### Step 3: Install & Initialize Backend

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install all dependencies:
   ```bash
   npm install
   ```

3. Generate the Prisma Client and push the schema to PostgreSQL:
   ```bash
   # Generates Prisma client types and syncs database schema tables
   npx prisma db push
   ```

4. Seed the database with realistic enterprise workforce records:
   ```bash
   npm run prisma:seed
   ```
   *(Or run `npx tsx prisma/seed.ts`)*

   This command populates:
   - Company profile & operational settings
   - 6 organizational departments with allocated budgets & heads
   - Core administrative and employee accounts
   - Compensation structures & leave quotas
   - 30-day realistic attendance records with punch times
   - Leave requests across pending, approved, and rejected states
   - Chronological audit activity logs

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will start at **`http://localhost:5000`** with hot reloading enabled.

---

### Step 4: Install & Run Frontend Client

1. Open a **new terminal** and navigate to the `frontend` folder:
   ```bash
   cd e:\EMS\frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   The application will be live at:
   👉 **`http://localhost:5173`**

> [!TIP]
> The Vite development server has a pre-configured proxy (`vite.config.ts`) that automatically routes any `/api` requests to `http://localhost:5000`. You do not need to configure CORS for local development.

---

## 🔑 Demo Login Accounts

You can either type in the credentials below or click any of the **1-Click Demo Buttons** on the login page:

| Role | Email | Password | Pre-configured Access |
|---|---|---|---|
| **Admin** | `admin@enterprise-ems.com` | `Admin@123` | Full access across all 9 modules, system settings, user management, and audit logs |
| **HR Manager** | `hr@enterprise-ems.com` | `Hr@123` | Employee directory CRUD, department assignments, attendance overrides, leave approvals, payroll generation, and reports |
| **Employee** | `john.doe@enterprise-ems.com` | `Emp@123` | Self-service attendance punching, personal leave requests, and personal payslips |

---

## 🗄️ Database Management & Inspection

### Prisma Studio (Visual Database GUI)
To view and edit database rows visually in your browser:
```bash
cd backend
npx prisma studio
```
Prisma Studio opens at **`http://localhost:5555`**.

### Resetting & Re-seeding Data
If you ever want to reset the database to a clean seed state:
```bash
cd backend
# Push fresh schema and run the seed script
npx prisma db push --force-reset
npm run prisma:seed
```

---

## 🩺 Troubleshooting & Common Questions

### 1. Database Connection Error (`P1001: Can't reach database server at localhost:5433`)
- Verify Docker is running: `docker compose ps`
- Check container logs: `docker logs ems-postgres`
- Ensure port `5433` is not blocked by your firewall or occupied by another service:
  ```powershell
  # Windows PowerShell
  Get-NetTCPConnection -LocalPort 5433 -ErrorAction SilentlyContinue
  ```

### 2. Port `5000` or `5173` already in use
- **Backend**: You can change `PORT=5001` in `backend/.env`. If you do, update `target` in `frontend/vite.config.ts`.
- **Frontend**: Vite will automatically offer port `5174` if `5173` is occupied.

### 3. Complete Docker Reset
To wipe the PostgreSQL volume and restart fresh:
```bash
docker compose down -v
docker compose up -d
cd backend
npx prisma db push
npm run prisma:seed
```

---

## 🏗️ Production Build Verification

To verify that both packages compile with zero errors for production:

```bash
# 1. Check Backend TypeScript Compilation
cd backend
npm run build

# 2. Check Frontend Production Bundle
cd ../frontend
npm run build
```

Both commands will exit with code `0`.
