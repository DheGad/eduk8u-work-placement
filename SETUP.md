# EDUK8U — Local PostgreSQL Setup Guide

## Step 1: Install PostgreSQL 15 (macOS)

```bash
# Install via Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Add to PATH (add to your ~/.zshrc)
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

## Step 2: Create Database & User

```bash
# Connect to postgres
psql postgres

# Run these SQL commands:
CREATE DATABASE eduk8u;
CREATE USER eduk8u_user WITH PASSWORD 'eduk8u_password_dev';
GRANT ALL PRIVILEGES ON DATABASE eduk8u TO eduk8u_user;
\q
```

## Step 3: Configure Environment

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Update these values in `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eduk8u
DB_USER=eduk8u_user
DB_PASSWORD=eduk8u_password_dev

JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<run same command again>
```

## Step 4: Run Migrations

```bash
cd backend
npm install
npx ts-node src/db/run_migrations.ts
```

Expected output:
```
✓ Migration 001_tenancy_auth.sql
✓ Migration 002_activity_logs.sql
...
✓ Migration 012_seed_data.sql
✓ All 12 migrations completed successfully
```

## Step 5: Start the Backend

```bash
cd backend
npm run dev
# → API running at http://localhost:3000
```

## Step 6: Start the Frontend

```bash
cd frontend
npm install
npm run dev
# → UI running at http://localhost:5173
```

## Health Check

```bash
curl http://localhost:3000/health
# {"status":"ok","version":"v1","environment":"development"}
```

## Seed Data Included

The seed (`012_seed_data.sql`) includes:
- **1 Tenant**: ICQA — Institute of Community & Career Australia (RTO 30667)
- **5 Students**: Sarah Jenkins, Mark Taylor, Lisa Wong, Tom Harris, Emma Nguyen
- **3 Host Facilities**: BlueCare Respite Centre (QLD), Opal Aged Care Tuggeranong (ACT), St Vincent's Aged Care Toowong (QLD)
- **5 Supervisors**: All with CHC33021-appropriate nursing/care qualifications
- **10 Placements**: Mix of active, monitoring, and completed stages
- **Admin User**: admin@icqa.edu.au / Password: IcqaAdmin2024!

## Full Workflow Test

Log in as `admin@icqa.edu.au`, then:
1. Go to **Placements** → Create New Placement
2. Select student, host, supervisor → Submit
3. Open the placement → **Log Hours** tab
4. Submit hours → Go to supervisor view → Approve
5. Upload evidence → **Documents** tab
6. Check **Compliance** tab for audit checklist
7. Click **Audit Report** → Print / Export PDF
