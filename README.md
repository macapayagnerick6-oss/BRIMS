# Barangay Resident Information Management System (BRIMS)

A web application for managing barangay resident information, built with **HTML5**, **CSS (SCSS)**, and **Angular 18**.

## Features

### Authentication
- **Login** – Sign in as Staff or Resident (demo accounts below)
- **Forgot Password** – Request password reset
- **Reset Password** – Set new password

### Staff
- **Dashboard** – Summary cards (Total Residents, Households, Senior Citizens), residents table with search/filters
- **Residents** – Full list with filters (Gender, Age, Purok), editable Purok dropdown; Add Resident
- **Resident Profile** – Personal info, Household info, Requests history tabs; Generate Certificate
- **Households** – List, Add Household, Household Detail
- **Reports** – Reporting views
- **Requests** – List and request detail
- **QR Scanner** – Scan QR codes using phone camera to quickly access resident profiles, requests, or certificates
- **Users & Roles** – User and role management
- **Settings** – Staff settings

### Resident
- **Dashboard** – Welcome message, quick actions (My Profile, Request Certificate, My Requests), request list with status
- **My Profile** – Personal info and household info
- **Request Certificate** – Form (document type, purpose), Submit; My Requests list
- **Reports** – Resident reports
- **My Requests** – Request list with status
- **Settings** – Resident settings

## Demo Login

| Role    | Email                 | Password (any) |
|---------|-----------------------|----------------|
| Staff   | `staff@barangay.gov`  | (any)          |
| Resident| `resident@email.com`  | (any)          |

## Setup

**Prerequisites:** Node.js (v18+ recommended) and npm.

```bash
npm install
npm start
```

Then open **http://localhost:4200**

**Note:** The QR Scanner feature requires camera access. Make sure to grant camera permissions when prompted in your browser.

## Build

```bash
npm run build
```

Output in `dist/brimms`.

## Tech Stack

- **Angular 18** – Standalone components, lazy-loaded routes
- **SCSS** – Styles and theming
- **Route guards** – Auth and role-based access
- **@zxing/ngx-scanner** – QR code scanning with camera support
- **In-memory data** – Replace with your backend/API for production

## Project Structure

```
src/app/
├── guards/          # auth.guard, role.guard
├── layouts/         # staff-layout, resident-layout (sidebar, topbar)
├── pages/           # Login, Staff pages, Resident pages
│   ├── login, forgot-password, reset-password
│   ├── staff-dashboard, residents-list, add-resident, resident-profile
│   ├── households, add-household, household-detail
│   ├── reports, requests, request-detail, users-roles, settings
│   ├── resident-dashboard, my-profile, request-certificate
│   ├── my-requests, resident-reports, resident-settings
│   └── ...
└── services/        # auth.service, data.service (mock)
```

- `src/styles.scss` – Global variables and utility classes
