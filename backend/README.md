# BRIMS Backend – SMS & Notifications

This is a minimal **Node.js + Express** backend that exposes SMS and notification APIs for the BRIMS Angular app.

## Providers

- **SMS**: Twilio
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`
- **Email**: Resend (recommended) or SMTP
  - **Resend** (works on Railway, no port blocking): `RESEND_API_KEY`, optional `RESEND_FROM` or `EMAIL_FROM`
  - **SMTP** (fallback): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

## API Endpoints

Base URL (development): `http://localhost:4000`

- `GET /api/health`  
  Simple health check endpoint.

- `POST /api/notifications/sms`  
  Send a one-off SMS to a single recipient.

  **Body:**
  ```json
  {
    "to": "+639XXXXXXXXX",
    "message": "Your BRIMS notification message"
  }
  ```

- `POST /api/notifications/sms/bulk`  
  Send SMS to multiple recipients.

  **Body:**
  ```json
  {
    "recipients": ["+639XXXXXXXXX", "+639YYYYYYYYY"],
    "message": "Bulk BRIMS notification"
  }
  ```

- `GET /api/notifications`  
  Returns the most recent notifications stored in memory (demo only, not persisted in a real database).

- `POST /api/notifications/email`  
  Send a one-off email to a single recipient.

  **Body:**
  ```json
  {
    "to": "resident@example.com",
    "subject": "Your BRIMS notification",
    "message": "Email body text"
  }
  ```

- `POST /api/notifications/email/bulk`  
  Send email to multiple recipients.

  **Body:**
  ```json
  {
    "recipients": ["resident1@example.com", "resident2@example.com"],
    "subject": "Bulk BRIMMS notification",
    "message": "Email body text"
  }
  ```

## Running the backend

```bash
cd backend
npm install
cp .env.example .env   # then edit .env with real Twilio credentials
npm run dev            # or: npm start
```

The server will start on `http://localhost:4000` by default.

> Note: Authentication and role-based access should be added when integrating with a real user system. For now, the endpoints are open for development/testing purposes only.

## Deploying the backend (production)

Firebase Hosting only serves your **frontend**. This Node backend must be deployed to a service that runs Node.js. After deployment, set that URL in the frontend’s `src/assets/config.json` as `apiBaseUrl`, and set `CORS_ORIGIN` in the backend `.env` to your frontend origin (e.g. `https://brims-2028e.web.app`).

### Option A: Railway (recommended, free tier)

1. Push your code to GitHub (include the `backend` folder).
2. Go to [railway.app](https://railway.app), sign in, **New Project** → **Deploy from GitHub** and select your repo.
3. Set **Root Directory** to `backend` (or add a `railway.json` / `nixpacks.toml` so the build runs from `backend`). Configure **Start Command**: `npm start`.
4. Add variables: copy from `.env` (e.g. `TWILIO_*`, `SMTP_*`, `CORS_ORIGIN=https://brims-2028e.web.app`).
5. Deploy; Railway will give you a URL like `https://your-app.up.railway.app`. Use this as `apiBaseUrl` in the frontend.

### Option B: Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect the repo, set **Root Directory** to `backend`.
3. Build: `npm install`, Start: `npm start`.
4. Add **Environment** variables from your `.env`, including `CORS_ORIGIN=https://brims-2028e.web.app`.
5. After deploy, use the Render URL (e.g. `https://brims-backend.onrender.com`) as `apiBaseUrl` in the frontend.

