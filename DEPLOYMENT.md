# Nexus EMS — Production Deployment Guide

This guide covers everything required to deploy the **Nexus Enterprise Employee Management System (EMS)** to production with high availability, database persistence, and reverse proxy security.

---

## 🚀 One-Click Automated Deployment

We have included automated deployment scripts that verify prerequisites, build optimized multi-stage Docker images, synchronize the database schema, seed test records, and launch the entire stack.

### On Windows (PowerShell)
From the repository root (`e:\EMS`):
```powershell
.\deploy.ps1
```

### On Linux / macOS / Cloud VPS (Bash)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Or Manually via Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Once running, access the application at:
👉 **`http://localhost`** (or your server's public IP / domain)

---

## 🏛️ Production Container Stack Architecture

The production environment consists of 3 isolated containers communicating over a private Docker bridge network (`ems_network`):

```mermaid
graph LR
    User["🌐 Browser / Client"]
    Nginx["Frontend Container (Nginx Alpine on :80)"]
    Express["Backend Container (Node.js 20 on :5000)"]
    DB[("Database Container (PostgreSQL 16)")]

    User -->|Port 80| Nginx
    Nginx -->|Static Assets & SPA Routing| Nginx
    Nginx -->|Proxy /api/| Express
    Express -->|Prisma ORM (port 5432)| DB
```

1. **Frontend (`ems-frontend-prod`)**:
   - Multi-stage build compiles React + TypeScript + Vite into static files.
   - Served via ultra-fast **Nginx Alpine**.
   - Handles client-side SPA routing (`try_files $uri $uri/ /index.html`).
   - Reverse-proxies all `/api/*` traffic directly to the backend container.
   - Built-in Gzip compression and browser asset caching headers.

2. **Backend (`ems-backend-prod`)**:
   - Multi-stage build compiles TypeScript with `tsc`.
   - Generates Prisma client types.
   - Entrypoint automatically pushes schema (`npx prisma db push`) and seeds database if needed.
   - Listens on internal port `5000`.

3. **Database (`ems-postgres-prod`)**:
   - PostgreSQL 16 Alpine container with healthchecks enabled.
   - Data stored permanently in named Docker volume `ems_pgdata_prod`.

---

## 🔑 Default Production Demo Accounts

The deployment script seeds the following role-based testing accounts:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@enterprise-ems.com` | `Admin@123` | Full access across all 9 modules, system settings, and user management |
| **HR Manager** | `hr@enterprise-ems.com` | `Hr@123` | Workforce CRUD, departments, attendance adjustments, leaves, payroll, reports |
| **Employee** | `john.doe@enterprise-ems.com` | `Emp@123` | Self-service punch in/out, personal leave applications, and individual payslips |

---

## 🌐 Deploying to a Cloud VPS (DigitalOcean, AWS EC2, Linode, Hetzner)

### Step 1: Provision an Ubuntu 22.04 or 24.04 Server
Connect to your server via SSH:
```bash
ssh root@your-server-ip
```

### Step 2: Install Docker & Docker Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Step 3: Clone Repository & Configure Environment
```bash
git clone https://github.com/your-username/ems.git
cd ems

# (Optional) Edit JWT_SECRET and credentials in docker-compose.prod.yml
nano docker-compose.prod.yml
```

### Step 4: Run the Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

Your system is now live at `http://your-server-ip`.

---

## 🔒 Setting Up Custom Domain & SSL (HTTPS)

### Option A: Using Cloudflare (Easiest & Free)
1. Point your domain (e.g. `ems.yourcompany.com`) `A` record to your server IP.
2. In Cloudflare Dashboard, set SSL/TLS encryption mode to **Full**.
3. Cloudflare will automatically provide free SSL certificates without modifying server configs.

### Option B: Using Certbot & Let's Encrypt with Nginx
1. On your host server:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d ems.yourcompany.com
   ```
2. Certbot will automatically configure HTTPS certificates and auto-renewals.

---

## ☁️ Deploying to Cloud PaaS (Railway / Render)

If you prefer managed cloud platforms over self-hosted Docker:

### Deploying on Railway
1. Create a new project on [Railway.app](https://railway.app/).
2. Add a **PostgreSQL** database service.
3. Add a **Backend Service**:
   - Root directory: `/backend`
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npx prisma db push && npm run prisma:seed && npm start`
   - Set environment variables: `DATABASE_URL` (from Railway Postgres), `JWT_SECRET`, `PORT=5000`.
4. Add a **Frontend Service**:
   - Root directory: `/frontend`
   - Build command: `npm install && npm run build`
   - Output directory: `dist`

---

## 💾 Database Maintenance & Backups

### Creating a Database Backup
```bash
docker exec -t ems-postgres-prod pg_dump -U postgres ems_db > ems_backup_$(date +%Y%m%d).sql
```

### Restoring a Database Backup
```bash
cat ems_backup_20261022.sql | docker exec -i ems-postgres-prod psql -U postgres -d ems_db
```

### Viewing Real-Time Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific container
docker compose -f docker-compose.prod.yml logs -f backend
```

### Stopping the Production Stack
```bash
docker compose -f docker-compose.prod.yml down
```
*(Your database volume `ems_pgdata_prod` is preserved across restarts).*
