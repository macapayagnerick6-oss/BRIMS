# Barangay Resident Information Management System (BRIMS)

BRIMS is a web-based **Barangay Resident Information Management System** built with **Angular 21**, **SCSS**, and a small **Node.js/Express** backend for SMS and email notifications. It is designed for barangay staff and residents to manage profiles, households, certificates, and requests in a single system.

---

## Table of Contents

- [Core Features](#core-features)
  - [Authentication & Access](#authentication--access)
  - [Users and Roles](#users-and-roles)
  - [Staff Portal (Admin & Staff)](#staff-portal-admin--staff)
  - [Resident Portal](#resident-portal)
- [Demo Login](#demo-login)
- [Frontend – Angular App](#frontend--angular-app)
- [Backend – SMS & Email Notifications](#backend--sms--email-notifications-optional-but-recommended)
- [Tech Stack](#tech-stack)
- [What's New](#whats-new)
- [Project Structure](#project-structure)
- [Database & Firebase](#database--firebase)
- [Environment Configuration](#environment-configuration)
- [Notes & Next Steps](#notes--next-steps)

---

## Core Features

### Authentication & Access
- **Role-based login** – Three roles: **Admin**, **Staff**, and **Resident**
- **Forgot/Reset password** flows
- **Route guards** – Protect staff-only and resident-only areas; admin-only routes are restricted to Admin (see [Users and Roles](#users-and-roles)).

### Global In-App Notifications
- **Notification bell in the top bar** with unread badge count
- **In-app notification panel** listing recent success, error, warning, and info messages
- **Mark-as-read and mark-all-as-read** interactions so staff and residents can quickly clear notifications
- **Context-aware visibility** – hidden on focused/full-screen flows such as login, password reset, settings, QR scanner, household map, and certain detail pages to keep those screens clean

### Users and Roles

| Role | Portal | What they can do and access |
|------|--------|----------------------------|
| **Admin** | Staff (Admin area `/admin`) | **Full access:** Dashboard, My Profile, QR Scanner, Requests (view & approve), Residents (list, add, edit, profiles), Households (list, map, add, edit, detail), Reports, **Users & Roles**, **SMS & Email**, **Audit Log**, **Archives**, **Settings**. Can manage user accounts, role assignments, broadcasts, and system settings. |
| **Staff** | Staff (Staff area `/staff`) | **Limited staff access:** Dashboard, My Profile, QR Scanner, Requests (view & process), Residents (list, add, edit, profiles), Households (list, map, add, edit, detail), Reports. **Cannot access:** Users & Roles, SMS & Email, Audit Log, Archives, Settings. |
| **Resident** | Resident (`/resident`) | **Resident-only:** Dashboard, My Profile, Request Certificate, My Requests, Resident Reports, Settings. Can view own profile, submit and track certificate requests, and update own profile/settings. |

**Role permissions (editable in Admin → Users & Roles):**

- **Admin** – Manage Users, Manage Roles, View All Reports, Manage Residents, Manage Households, Approve & Process Requests, System Settings, SMS & Email Broadcast, View Audit Log, Manage Archives, QR Scanner.
- **Staff** – View Reports, Manage Residents, Manage Households, Process Requests, QR Scanner.
- **Resident** – View Own Profile, Request Certificates, View Own Requests, View Resident Reports, Update Profile & Settings.

### Staff Portal (Admin & Staff)
Shared by both Admin and Staff:

- **Dashboard**
  - Summary cards (Total Residents, Households, Senior Citizens, etc.)
  - Recent activity and quick navigation
- **Residents Management**
  - Search and filter by gender, age, purok
  - Add new residents, edit details, and manage household membership
- **Resident Profile**
  - Personal and household information
  - Requests history
  - Generate certificates (e.g., residency, indigency)
- **Households**
  - List, add, edit, and view household details
  - **Household map** view for geographic visualization (if configured)
- **Reports**
  - Staff reporting views (population, household, age/sex breakdowns, etc.)
- **Requests**
  - View and process certificate and document requests from residents
  - Archive completed or no-longer-needed requests (Admin) so they move to the **Archives** module instead of the main list
  - Request detail views for auditing actions
- **QR Scanner**
  - Scan resident or request QR codes using device camera
  - Quickly open resident profiles, requests, or certificates

**Admin only** (hidden from Staff; guarded routes):

- **Archives** – View and restore archived residents, households, certificate requests, and staff accounts
  - Filter by search terms, purok, date ranges, status, and role
  - Restore archived items back to active status
- **SMS & Email** – SMS broadcast (Twilio) and email broadcast (Nodemailer) to residents
- **Users & Roles** – Manage user accounts and role assignments (Admin/Staff): create Admin/Staff logins, search and filter by role/status, activate/deactivate accounts, archive Admin/Staff users to the **Archives** module, and edit role descriptions and permissions
- **Audit Log** – Track key actions for accountability and traceability
- **Settings** – Staff-side configuration and preferences

### Resident Portal
- **Dashboard**
  - Welcome section and quick actions (My Profile, Request Certificate, My Requests)
- **My Profile**
  - View personal and household information
- **Request Certificate**
  - Submit certificate/document requests with type and purpose
- **My Requests**
  - Track request statuses and details
- **Resident Reports**
  - View reports relevant to logged-in resident
- **Settings**
  - Manage basic profile and preferences

---

## Demo Login

> These are example/demo credentials. Adjust or remove in production.

| Role     | Email                 | Password (any) |
|----------|-----------------------|----------------|
| Admin    | `admin@barangay.gov`   | (any)          |
| Staff    | `staff@barangay.gov`   | (any)          |
| Resident | `resident@email.com`  | (any)          |

---

## Frontend – Angular App

### Requirements
- **Node.js** v18+
- **npm** (comes with Node)

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm start
```

Then open `http://localhost:4200` in your browser.

> **Note:** The QR Scanner feature requires camera access. Allow camera permissions when prompted.

### Build for production

```bash
npm run build
```

The production build will be generated in `dist/brimms`.

---

## Backend – SMS & Email Notifications (Optional but Recommended)

This project ships with a minimal backend (in the `backend` folder) that provides REST APIs for:

- Sending **single SMS** and **bulk SMS** (via Twilio)
- Sending **single email** and **bulk email** (via SMTP/Nodemailer)
- Listing recent notifications (in-memory, demo only)

### Backend setup

```bash
cd backend
npm install
cp .env.example .env   # fill in Twilio + SMTP credentials
npm run dev            # or: npm start
```

The backend will run on `http://localhost:4000` by default. Make sure the Angular app points to this URL for notification-related APIs.

---

## Tech Stack

- **Angular 21** – Standalone components, lazy-loaded routes
- **Angular CDK** – Accessibility and UI primitives
- **SCSS** – Global styles and component-level styling
- **Route guards** – Auth and role-based access control
- **@zxing/ngx-scanner** (v21) – QR code scanning using camera
- **Chart.js + ng2-charts** – Charts and data visualization (reports, dashboard)
- **Leaflet** – Maps for household/geographic views
- **Firebase (AngularFire) + Firestore** – Primary data store used by the app
- **Node.js + Express** – Lightweight notification backend (`backend`)
- **Twilio** – SMS provider
- **Nodemailer + SMTP** – Email provider
---

## What's New

- **Global notifications center** – Added a top-bar notification bell with an in-app notifications panel, unread badge, and mark-all-as-read behavior, available across staff and resident layouts (but hidden on focused pages like login, settings, QR scanner, and the full-screen household map).
- **Improved Requests management** – The main Requests table now shows only active (non-archived) requests, and Admins can archive completed or irrelevant requests, which are then managed from the **Archives** section.
- **Richer Users & Roles management** – Admins can add Admin/Staff accounts with validation, toggle user status, archive Admin/Staff accounts, and maintain role descriptions and permission lists via a dedicated modal.
- **UI/UX refinements** – Polished layout and responsive behavior for admin pages (including Requests and Users & Roles) to reduce double scrollbars and improve spacing on smaller screens.

---

## Project Structure

### Frontend (`src/app/`)

```text
src/app/
├── guards/
│   ├── admin.guard.ts      # Admin-only route protection
│   ├── auth.guard.ts       # Requires logged-in user
│   └── role.guard.ts       # Role-based access (staff vs resident)
├── layouts/
│   ├── admin-layout/       # Admin shell (top bar + sidebar, admin-only sections)
│   ├── staff-layout/       # Shared staff shell for day‑to‑day operations
│   └── resident-layout/    # Layout for Resident portal
├── pages/
│   ├── login, forgot-password, reset-password
│   ├── staff-dashboard, staff-profile
│   ├── residents-list, add-resident, resident-profile
│   ├── households, add-household, edit-household, household-detail, household-map
│   ├── reports, requests, request-detail
│   ├── admin-sms-broadcast, admin-email-broadcast
│   ├── users-roles, audit-log, settings, archives
│   ├── qr-scanner
│   ├── resident-dashboard, my-profile, request-certificate
│   ├── my-requests, resident-request-detail, resident-reports, resident-settings
│   └── (each as .ts, .html, .scss)
├── services/
│   ├── auth.service.ts                     # Login / current user
│   ├── data.service.ts                     # Core data layer (uses injected database service)
│   ├── database.interface.ts               # IDatabaseService abstraction
│   ├── local-storage-database.service.ts   # Local storage implementation (legacy/demo)
│   ├── firebase-database.service.ts        # Firestore implementation (active)
│   ├── json-server-database.service.ts     # JSON Server integration (optional/demo)
│   ├── audit-log.service.ts                # Audit trail for key actions
│   ├── notification.service.ts             # In‑app notifications
│   ├── notification-type-label.pipe.ts     # Human‑friendly labels for notification types
│   ├── sms.service.ts, email.service.ts    # SMS / email notification clients
│   ├── qr-code.service.ts                  # QR generation / helper logic
│   ├── theme.service.ts                    # Light/dark theme + tokens
│   ├── certificate-generator.service.ts    # Certificate text/format helpers
│   └── error-handler.service.ts            # Centralized error handling
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

- **`src/styles.scss`** – Global variables, color tokens, utility classes

### Backend (`backend/`)

```text
backend/
├── server.js        # Express app: SMS/email APIs
├── .env.example     # Twilio + SMTP template
├── package.json
└── README.md
```

---

## Database & Firebase

BRIMS is **Firebase integrated** and uses **Firestore** as its primary datastore.

- **Firebase wiring**: `src/app/app.config.ts` initializes Firebase (`environment.firebase`) and provides Firestore.
- **Active database implementation**: the app binds `DATABASE_SERVICE` to `FirebaseDatabaseService` (via `IDatabaseService`), so reads/writes go to Firestore.
- **Swappable data layer**: the `IDatabaseService` abstraction remains, so you can swap implementations (e.g. JSON Server) if needed.

---

## Environment Configuration

Environment files already exist under `src/environments/`:

- **`environment.ts`**: local/dev defaults (includes `apiBaseUrl` and `firebase` config)
- **`environment.prod.ts`**: production defaults (set `apiBaseUrl` to your deployed backend URL; keep your Firebase config accurate)

The frontend uses:

- **`environment.firebase`** for Firebase initialization (AngularFire)
- **`environment.apiBaseUrl`** for the optional SMS/email backend

### Runtime API base URL override (optional)
If you deploy the Angular app separately from the backend, you can override the backend URL at runtime via `src/assets/config.json`:

```json
{ "apiBaseUrl": "https://your-backend.example.com" }
```

---

## Notes & Next Steps

- For production, make sure your **Firebase project** (Firestore rules, indexes, and allowed origins) is correctly configured for your deployment.
- Secure the backend APIs with proper **authentication** and **authorization**.
- Configure proper **environment files** (`environment.prod.ts`) or `assets/config.json` to point to your production backend URL (SMS/email).
- Implement proper password hashing for user authentication (currently accepts any password for demo purposes).
- Add data export/import functionality for backups and migrations.
