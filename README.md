# Doctor Tracker — Backend

REST API for doctors, patients, hospitals, specializations and analytics.
Node.js · Express · TypeScript · MongoDB.

## Run locally

```bash
npm install
npm run seed:admin   # create the admin user (once)
npm run serve        # http://localhost:5000/api
```

## Environment (`.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=...
APP_TIMEZONE=Asia/Dhaka                 # optional, default UTC
CORS_ORIGINS=https://your-frontend.app  # optional, comma-separated
```

## Docker

```bash
docker build -t doctor-tracker-api .
docker run -d --env-file .env -p 5000:5000 doctor-tracker-api
```

## API

All routes except `/api/auth` and `/api/health` need `Authorization: Bearer <token>`.

| Route | |
|---|---|
| `/api/auth` | Login |
| `/api/doctors` | Doctors, and their patients (`/:id/patients`) |
| `/api/patients` | Patients, and their doctors (`/:id/doctors`) |
| `/api/hospitals` | Hospitals |
| `/api/specializations` | Specializations |
| `/api/analytics` | Dashboard figures |
