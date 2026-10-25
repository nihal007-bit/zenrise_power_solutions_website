# Zenrise Power Solutions website

A local full-stack project for Zenrise Power Solutions Pvt. Ltd. It has a public product and enquiry website plus a protected admin dashboard for customer records, enquiries, service requests, analytics, and CSV exports.

> This repository contains application code and fictional seed data. It does not contain the live PostgreSQL database, real customer records, or passwords.

## Features

- Public pages for the company, product categories, contact information, and enquiry form.
- Admin sign-in with an Argon2 password hash and one-hour JWT session.
- Customer records with required name and 10-digit contact number; optional email, location, product interest, and notes.
- Enquiries that an admin can review, change status, and link to an existing customer or convert to a new one.
- Service requests linked to customers, with **Open**, **In Progress**, and **Resolved** statuses.
- Customer analytics and CSV exports derived from saved records.
- Optional script to insert 75 unmistakably fictional customer records for a local demo.

## Stack and structure

| Part | Technology | Folder |
| --- | --- | --- |
| Website and admin UI | React, Vite, CSS | `frontend/` |
| API and authentication | Python, FastAPI | `backend/main.py` |
| Database | PostgreSQL, psycopg | `backend/schema.sql` |

The public enquiry form sends a request to `POST /api/enquiries`. Admin pages send bearer-authenticated requests to `/api/admin/*`. PostgreSQL stores customers, enquiries, and service requests. Product cards and company copy are currently defined in `frontend/src/App.jsx`.

## Local setup (Windows PowerShell)

You need Node.js, Python, and PostgreSQL. The steps below use `npm.cmd` because some Windows PowerShell configurations block `npm.ps1`.

### 1. Create the database and application role

Open PostgreSQL's `psql` as the `postgres` user, then run these statements with **your own new password**:

```sql
CREATE ROLE zenrise_app LOGIN PASSWORD 'choose-a-strong-local-db-password';
CREATE DATABASE zenrise_db;
```

If the role or database already exists, keep your existing ones. Back in PowerShell, apply the schema from the repository root (change the PostgreSQL installation path if needed):

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 127.0.0.1 -U postgres -d zenrise_db -v ON_ERROR_STOP=1 -f .\backend\schema.sql
```

### 2. Configure and start the backend

```powershell
cd .\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .\.env.example .\.env
```

Open `backend/.env` and set `DB_PASSWORD` to the **application role password** from step 1. Keep `.env` private; `.gitignore` excludes it. Then create the admin account:

```powershell
.\.venv\Scripts\python.exe .\setup_admin.py
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

The setup script asks for an admin username and password and stores only the hash and signing key in `backend/.env`. Rerunning it resets the admin credentials; restart Uvicorn afterward. Check [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) for `{"status":"ok"}`. API documentation is at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Start the frontend

In a **second** PowerShell window, from the repository root:

```powershell
cd .\frontend
npm.cmd install
npm.cmd run dev
```

Open the Vite Local URL, usually [http://localhost:5173/](http://localhost:5173/). Open [http://localhost:5173/admin](http://localhost:5173/admin) to sign in. Keep both PowerShell windows open while using the app.

The frontend calls `http://127.0.0.1:8000`. If Vite selects another port, add that exact frontend origin to `FRONTEND_ORIGINS` in `backend/.env` and restart Uvicorn.

## Add optional demo customers

Run this from `backend/` after configuring the database:

```powershell
.\.venv\Scripts\python.exe .\seed_customers.py
```

This inserts up to 75 fictional customers with zero-prefixed contact numbers and `example.com` emails. It skips existing demo phone numbers when run again. The dates are spaced out so the analytics charts have meaningful data. **Do not use the demo records as real customer contacts.**

## Try the workflow

1. Submit an enquiry through the public website.
2. Sign in at `/admin`, then review the enquiry and convert or link it to a customer.
3. Add or edit a customer, refresh the page, and confirm the data remains.
4. Create a service request for that customer and update its status.
5. Open Customer Analytics and download a CSV from Reports.

## Development checks

```powershell
cd .\frontend
npm.cmd run build
```

This is a local learning project. It has one admin account, no public deployment configuration, and no spam or rate limiting on the public enquiry endpoint. Use fictional records for demos. Confirm company text, contact details, and logo usage with Zenrise before sharing the site publicly.
