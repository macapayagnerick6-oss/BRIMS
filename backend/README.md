# BRIMMS Backend – SMS & Notifications

This is a minimal **Node.js + Express** backend that exposes SMS and notification APIs for the BRIMMS Angular app.

## Providers

- **SMS**: Twilio
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`
- **Email**: Generic SMTP via Nodemailer
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `EMAIL_FROM` (optional, falls back to `SMTP_USER` if not set)

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
    "message": "Your BRIMMS notification message"
  }
  ```

- `POST /api/notifications/sms/bulk`  
  Send SMS to multiple recipients.

  **Body:**
  ```json
  {
    "recipients": ["+639XXXXXXXXX", "+639YYYYYYYYY"],
    "message": "Bulk BRIMMS notification"
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
    "subject": "Your BRIMMS notification",
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

