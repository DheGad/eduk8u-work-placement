# EDUK8U — Australian RTO Work Placement Intelligence & Compliance Platform (Release 1.0)

[![Release](https://img.shields.io/badge/Release-1.0%20Production%20Certified-brightgreen.svg)](http://64.176.80.212:8080)
[![Live VPS](https://img.shields.io/badge/Live%20Target-http%3A%2F%2F64.176.80.212%3A8080-blue.svg)](http://64.176.80.212:8080)
[![Standards](https://img.shields.io/badge/Compliance-ASQA%20Standards%20for%20RTOs%202025-blueviolet.svg)](#statutory-compliance-engine)
[![Lead QA](https://img.shields.io/badge/Lead%20QA-Ameer%20Danial-orange.svg)](#lead-qa-validation-guide)

---

## 1. Executive Summary

**EDUK8U Work Placement Intelligence Platform** is an Australian Registered Training Organisation (RTO) compliance and vocational placement management engine. Engineered specifically for ASQA (Australian Skills Quality Authority) audit readiness under the **Standards for RTOs 2025** and **CRICOS Course Delivery (Subclass 500)** standards.

The platform provides end-to-end automation across the student vocational placement lifecycle: host facility accreditation (Form CA 0393), workplace tripartite agreements (Form CA 0316), geofenced student timesheets, digital supervisor sign-offs, trainer competency determinations, and one-click ASQA audit evidence extraction.

### 🌐 Live Production Target
- **Live Production URL:** [`http://64.176.80.212:8080`](http://64.176.80.212:8080)
- **Deployment Server:** Vultr VPS (`64.176.80.212`)
- **Backend Port:** 3000 (Internal) / Reverse Proxied via Nginx on 8080
- **Database:** PostgreSQL 15 on Port 5432

---

## 2. Pre-Seeded Test Accounts for Independent QA

The production database is pre-seeded with active credentials across all 5 system roles:

| User Tier | Email Address | Password | Primary QA Verification Focus |
|---|---|---|---|
| **Super Admin** | `admin@eduk8u.edu.au` | `Admin@123456` | Multi-tenant governance, RTO registration, master audit logs, compliance radar. |
| **College Admin** | `college@eduk8u.edu.au` | `College@123456` | RTO institution management, courses, student enrolments, trainer allocations. |
| **Trainer / Assessor** | `trainer@eduk8u.edu.au` | `Trainer@123456` | Student competency assessments, logbook approvals, workplace site visits, sign-offs. |
| **Student** | `student@eduk8u.edu.au` | `Student@123456` | Placement onboarding, hours logging, geofenced attendance, supervisor signatures. |
| **Host Supervisor** | `supervisor@eduk8u.edu.au` | `Supervisor@123456` | Host facility profile, timesheet approvals, weekly student performance ratings. |

---

## 3. Platform Architecture

```text
eduk8u-work-placement/
├── backend/                     # Node.js 20 + Express + TypeScript Backend
│   ├── src/
│   │   ├── server.ts            # REST API, Auth, RBAC, Placements, Compliance & Audit
│   │   └── db/                  # PostgreSQL migrations (25+ tables)
│   ├── Dockerfile               # Production multi-stage container
│   └── package.json
├── frontend/                    # Vite + React 19 + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── App.tsx              # Role-based SPA router and views
│   │   └── main.tsx
│   ├── Dockerfile               # Optimized Nginx static serving container
│   └── package.json
├── nginx/                       # Reverse proxy routing frontend + /api to backend
│   └── nginx.conf
├── docker-compose.production.yml# Production container orchestration
└── QA_VALIDATION_GUIDE.md       # Complete 20-point QA verification matrix for Ameer
```

---

## 4. Key Functional Capabilities

### 🏛️ 1. Multi-Tenant RTO Management
- Standards for RTOs 2025 compliance isolation.
- Course workflows with dynamic required hours (e.g., CHC33021: 120 hours).

### 🏥 2. Host Facility Accreditation (Form CA 0393)
- Suitability checklist with 5 core criteria (Physical environment, supervision capacity, equipment/resources, WHS compliance, policies).
- Public Liability Insurance ($20M AUD) verification.

### 📝 3. Tripartite Workplace Agreements (Form CA 0316)
- Legally compliant tripartite agreements between RTO, Student, and Host Facility.
- Digital signature capture and cryptographic verification.

### ⏱️ 4. Geofenced Timesheets & Hour Verification
- GPS verification ensuring student check-ins occur within host facility geofence boundaries.
- Supervisor one-click digital verification locking timesheets against tampering.

### 📊 5. ASQA Real-Time Compliance Radar
- Continuous monitoring of student placement ratios, supervision capacity, and missing documentation.
- Instant export of complete ASQA evidence audit pack in ZIP and PDF formats.

---

## 5. Local Setup & Testing

### Running with Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/DheGad/eduk8u-work-placement.git
cd eduk8u-work-placement

# 2. Configure environment
cp .env.example .env

# 3. Spin up full stack
docker compose -f docker-compose.production.yml up -d --build
```

Access local frontend at `http://localhost:8080`.

---

## 6. Lead QA Handover Guide

Please review [`QA_VALIDATION_GUIDE.md`](./QA_VALIDATION_GUIDE.md) for the complete QA validation checklists, role-by-role test scenarios, API endpoint tests, and expected results.
