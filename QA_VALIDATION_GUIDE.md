# EDUK8U Work Placement Platform — Lead QA Validation Guide

**Target Audience:** Ameer Danial (`amerdnl`), Lead QA Engineer  
**Live Production URL:** [`http://64.176.80.212:8080`](http://64.176.80.212:8080)  
**Evaluation Target:** Release 1.0 Milestone Baseline  

---

## 1. QA Test Execution Matrix (20 Test Checkpoints)

| ID | Test Scenario | Steps to Execute | Expected Result | Pass Criteria |
|:---|:---|:---|:---|:---|
| **TC-01** | **Landing & Navigation** | Visit `http://64.176.80.212:8080/`. Review landing page, feature highlights, and navigation links. | Clean load, zero console errors, responsive design. | UI renders in < 500ms. |
| **TC-02** | **Super Admin Authentication** | Log in with `admin@eduk8u.edu.au` / `Admin@123456`. | Redirect to Admin Dashboard with RTO tenant stats and audit counters. | JWT received, session established. |
| **TC-03** | **College Admin Setup** | Log in with `college@eduk8u.edu.au` / `College@123456`. Open Courses tab. | List courses: CHC33021 Certificate III in Individual Support (120 hrs). | Correct course configuration displayed. |
| **TC-04** | **Student Placement List** | From College Admin, view Placements roster. Filter by "Active" status. | Table displays student names, assigned facilities, accumulated hours, and compliance scores. | Zero undefined values in table rows. |
| **TC-05** | **Host Facility Accreditation** | Open Host Facilities tab. Select "St Jude Aged Care Centre". | View Form CA 0393 suitability score (Physical environment, WHS, supervision capacity). | Suitability rating marked APPROVED. |
| **TC-06** | **Insurance Verification** | Inspect Host Facility insurance records. | Public liability policy ($20M AUD) active with valid expiry date. | Policy status verified. |
| **TC-07** | **Student Login** | Log in with `student@eduk8u.edu.au` / `Student@123456`. | Redirect to Student Placement Portal. Active placement card displayed. | Student sees assigned host facility & trainer. |
| **TC-08** | **Timesheet Hours Logging** | On Student portal, click "Log Placement Hours". Enter 8 hours, date, and activities. | Entry saved as `SUBMITTED`. Accumulated hours increment in progress bar. | Database record created in `placement_hours`. |
| **TC-09** | **Geofence Check-in** | Toggle GPS check-in during hours submission. | System checks coordinates against facility boundaries. | Verification badge shows Geofence Match. |
| **TC-10** | **Supervisor Login** | Log in with `supervisor@eduk8u.edu.au` / `Supervisor@123456`. | Supervisor Dashboard displays pending student hours for approval. | Pending hours badge counter updated. |
| **TC-11** | **Supervisor Digital Sign-off** | Review submitted timesheet entry. Click "Verify & Sign". Draw or approve signature. | Status transitions to `VERIFIED`. Student can no longer edit hours. | Digital signature cryptographic hash saved. |
| **TC-12** | **Trainer Login** | Log in with `trainer@eduk8u.edu.au` / `Trainer@123456`. | Trainer Dashboard shows allocated students and placement milestones. | Correct student allocations displayed. |
| **TC-13** | **Competency Assessment** | Open student logbook. Assess competency units (CHCCCS015, CHCCCS011, HLTWHS002). | Trainer marks units Satisfactory / Competency Achieved. | Assessment determinations logged. |
| **TC-14** | **Compliance Score Engine** | Check Placement compliance score. | Score dynamically computes based on approved hours, checklist items, and supervisor sign-offs. | Real-time score update (e.g. 85%). |
| **TC-15** | **Tripartite Agreement (CA 0316)** | View Placement Agreement document. | RTO, Student, and Host Supervisor signature sections rendered. | Status: `FULLY_SIGNED`. |
| **TC-16** | **ASQA Audit Pack Export** | In Admin or Trainer view, click "Export ASQA Audit Pack". | Generates consolidated audit package with timesheets, agreements, and logbook entries. | Download completes without error. |
| **TC-17** | **Role-Based Access Control** | While logged in as Student, attempt to call `GET /api/v1/tenants` or access `/admin`. | Intercepted with HTTP 403 Forbidden. Access denied banner displayed. | Zero privilege escalation. |
| **TC-18** | **Immutable Audit Trail** | Navigate to System Audit Logs as Super Admin. | View all recent state mutations (logins, hours logged, supervisor verifications). | Audit record contains actor, action, timestamp, IP. |
| **TC-19** | **Mobile Responsiveness** | Inspect site on mobile viewport (375x812). | Responsive layout adjusts; mobile drawer navigation works smoothly. | Mobile usability verified. |
| **TC-20** | **Zero Console Exceptions** | Open Chrome Developer Tools Console across all 5 user roles. | 0 breaking JavaScript exceptions or unhandled promise rejections. | Clean browser console. |

---

## 2. API Health & Status Verification

Ameer can run the following curl commands to verify the live API health:

```bash
# 1. API Health Check
curl -s http://64.176.80.212:8080/api/v1/health | jq .

# 2. Authenticate as Super Admin
curl -s -X POST http://64.176.80.212:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eduk8u.edu.au","password":"Admin@123456"}' | jq .
```
