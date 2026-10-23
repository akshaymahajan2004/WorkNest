# Nexus EMS — Enterprise Employee Management System

A complete, production-ready, full-stack **Employee Management System (EMS)** designed for modern enterprise workforce operations. Built with a blue-and-white SaaS aesthetic, role-based security, modular architecture, real-time database persistence, interactive dashboards, and business intelligence reporting with CSV export.

---

## 🌟 Key Features & Modules

### 1. Executive Dashboard
- **Live Workforce KPIs**: Real-time counts of total employees, active staff, on-leave personnel, present today, late arrivals, and monthly payroll disbursement.
- **Department Distribution**: Interactive breakdown and visual progress bars showing headcount and percentage per department.
- **Weekly Attendance Trends**: 7-day status chart visualizing on-time present, late arrivals, and absent counts.
- **Recent Onboarding**: New hires roster with joining dates, avatar, role, and department.
- **Pending Leave Approvals**: Actionable table with instant 1-click **Approve** and **Reject** buttons.
- **Operational Shortcuts**: Quick navigation ribbons for adding employees, logging attendance, filing leaves, and generating payroll.

### 2. Employee Management
- **Workforce Directory**: Searchable by employee name, employee code (e.g., `EMP-001`), email, and job title.
- **Multi-Factor Filters**: Filter by Department, Employment Status (`ACTIVE`, `ON_LEAVE`, `TERMINATED`), and Employment Type (`FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERN`).
- **Full CRUD Support**: Add new employees with automatic code generation, edit existing records, and safely delete with confirmation dialogs.
- **Detailed Employee Profiles**: Comprehensive view containing personal details, contact information, compensation breakdown, and annual leave balances.

### 3. Department Management
- **Department Hub**: Visual cards showing department code, team size, allocated budget, and appointed department heads.
- **Department Roster**: Modal displaying all personnel assigned to each department.
- **Budget Tracking**: Organization-wide annual operating budget aggregation.
- **CRUD Operations**: Create, edit, and safely delete departments with safeguards preventing accidental deletion of populated units.

### 4. Attendance Management
- **Daily Roster**: Date-picker roster displaying punch-in time, punch-out time, total work hours, and status.
- **Self-Service Punch Widget**: Real-time header widget for logged-in employees to check in and check out.
- **Manager Overrides**: Admin and HR can manually adjust timestamps, flags (`PRESENT`, `LATE`, `HALF_DAY`, `ABSENT`), and remark notes.
- **Daily Summary**: Calculates on-time arrival rate, tardiness, and unexcused absences.

### 5. Leave Management
- **Leave Balances**: Tracks allocated, utilized, and remaining days for Annual, Sick, and Casual leaves.
- **Leave Application Modal**: Multi-day calculator with reason justification and validation against remaining quotas.
- **Approval Workflow**: HR/Admin review pipeline supporting approval and rejection with mandatory explanation.
- **Automatic Balance Deductions**: Approving leaves automatically deducts from the employee's active yearly balance.

### 6. Payroll & Compensation
- **Salary Structures**: Configurable basic pay, allowances (HRA, Conveyance, Medical, Special), and deductions (Provident Fund, Tax, Other).
- **Batch Payroll Engine**: 1-click generation of monthly payroll records across all active personnel.
- **Disbursement Workflow**: Tracks statuses through `DRAFT` ➔ `PROCESSED` ➔ `PAID`.
- **Itemized Payslip Viewer**: Print-ready, corporate pay stub with company letterhead, full earnings, deductions, and net salary.

### 7. Reports & Analytics
- **Live Previews**: Interactive tables across 4 core domains:
  1. Employee Directory Report
  2. Monthly Attendance Report
  3. Leave Summary Report
  4. Payroll & Compensation Report
- **Instant CSV Export**: Direct 1-click spreadsheet download for each report with customized query parameters.

### 8. System Settings & Security
- **Corporate Profile**: Edit company name, primary email, phone, physical address, currency symbol, timezone, and leave policies.
- **User Accounts**: Manage login accounts, toggle active/disabled states, and reassign roles.
- **Permissions Matrix (RBAC)**: Transparent breakdown of Admin, HR, and Employee authorizations.
- **Audit Logs**: Chronological timeline of administrative events and actions.

### 9. Authentication & RBAC
- **Secure JWT Authentication**: Hashed passwords via `bcryptjs`, signed JWT tokens, and token expiration handling.
- **Role-Based Guards**: Server-side route authorization and UI controls for `ADMIN`, `HR`, and `EMPLOYEE`.
- **1-Click Demo Logins**: Dedicated login buttons for instant evaluation without typing credentials.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript, RESTful API architecture |
| **Database & ORM** | PostgreSQL 16 (Dockerized), Prisma ORM |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt.js, RBAC Middleware |
| **DevOps** | Docker Compose |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended; v22 supported)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)

---

### Step 1: Start PostgreSQL via Docker

In the project root (`e:/EMS`):

```bash
docker compose up -d
```

> **Note**: PostgreSQL is mapped to port **`5433`** (`localhost:5433`) to ensure no conflicts with any pre-existing local PostgreSQL service on default port 5432.

---

### Step 2: Configure and Seed Backend

```bash
cd backend

# Install backend dependencies
npm install

# Push Prisma schema to PostgreSQL database
npx prisma db push

# Seed realistic workforce data (departments, employees, attendance, payroll)
npx tsx prisma/seed.ts

# Start backend dev server (Runs on http://localhost:5000)
npm run dev
```

---

### Step 3: Start Frontend Client

In a separate terminal:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite dev server (Runs on http://localhost:5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Default Test Credentials

Use these credentials or click the **1-Click Demo Account** buttons on the login page:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@enterprise-ems.com` | `Admin@123` | Full access across all 9 modules, system settings, and user management |
| **HR Manager** | `hr@enterprise-ems.com` | `Hr@123` | Workforce CRUD, department assignments, attendance adjustments, leave approvals, payroll generation, and reports |
| **Employee** | `john.doe@enterprise-ems.com` | `Emp@123` | Self-service attendance punching, personal leave applications, and individual payslip downloads |

---

## ⚙️ Environment Variables

### Root / Backend `.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ems_db?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET="super-secret-ems-jwt-key-change-in-production-2026"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

---

## 📁 Repository Directory Structure

```text
e:/EMS/
├── docker-compose.yml         # Containerized PostgreSQL (development)
├── docker-compose.prod.yml    # Full-stack production orchestration (DB, API, Nginx)
├── deploy.ps1                 # Automated 1-click Windows deployment script
├── deploy.sh                  # Automated 1-click Linux/Cloud deployment script
├── .env.example               # Reference environment variables
├── README.md                  # Complete documentation and overview
├── SETUP.md                   # Step-by-step setup and installation guide
├── WALKTHROUGH.md             # End-to-end system walkthrough and architecture
├── DEPLOYMENT.md              # Production deployment handbook
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema (User, Employee, Department, Attendance, Leave, Payroll, Settings, Audit)
│   │   └── seed.ts            # Realistic enterprise seed data script
│   ├── src/
│   │   ├── lib/prisma.ts      # Prisma client singleton
│   │   ├── middleware/        # Authentication & Role guards (auth.ts), error handler
│   │   ├── routes/            # REST API modules (auth, dashboard, employee, department, attendance, leave, payroll, reports, settings)
│   │   ├── app.ts             # Express application wiring & middleware
│   │   └── index.ts           # Server bootstrap
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/        # Modal, ConfirmDialog, Pagination, StatCard
    │   │   └── layout/        # Sidebar with role switcher, Topbar with punch widget, Layout
    │   ├── context/           # AuthContext (RBAC state) and ToastContext (notifications)
    │   ├── pages/             # Login, Dashboard, Employees, Departments, Attendance, Leaves, Payroll, Reports, Settings
    │   ├── services/          # Standardized API client and module fetchers
    │   ├── types/             # Full TypeScript interfaces
    │   ├── index.css          # Modern enterprise CSS design tokens and utility classes
    │   ├── App.tsx            # Main application router
    │   └── main.tsx           # React entry point
    ├── index.html             # HTML5 template with Google Fonts (Plus Jakarta Sans)
    ├── vite.config.ts         # Vite server configuration with API proxy
    ├── package.json
    └── tsconfig.json
```

---

## 🧪 Production Verification Checklist

- [x] Docker PostgreSQL running on port 5433
- [x] Prisma ORM migrations and schema push completed
- [x] Comprehensive enterprise seed data initialized
- [x] Express REST API listening on port 5000 with CORS and JWT auth
- [x] Vite React frontend compiling with 0 TypeScript errors
- [x] Browser automated walkthrough verified all 9 modules
- [x] Real-time attendance punch widget verified
- [x] Batch payroll generator and official payslips verified
- [x] Real CSV export for all 4 report types verified
