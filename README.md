---
title: MediConnect Pro
emoji: 🩺
colorFrom: indigo
colorTo: green
sdk: docker
pinned: true
license: mit
short_description: Full-stack telemedicine platform - Book doctors, video calls, AI symptom checker, pharmacy, lab tests
---

# 🩺 MediConnect Pro — Complete Telemedicine Platform

A production-ready, full-stack healthcare platform with **Patient**, **Doctor**, and **Admin** frontends, real-time video calls, AI symptom checker, online pharmacy, and lab test booking.

## 🔗 Live Links

| Portal | Link |
|--------|------|
| 🏥 **Full App (Patient/Doctor)** | [https://mediconnect-pro-kbbb.onrender.com](https://mediconnect-pro-kbbb.onrender.com) |
| ⚙️ **Admin Dashboard** | [https://mediconnect-admin-p99i.onrender.com/?portal=admin](https://mediconnect-admin-p99i.onrender.com/?portal=admin) |
| 🏥 **Patient (Static)** | [https://prince53454.github.io/mediconnect-patient/](https://prince53454.github.io/mediconnect-patient/) |
| 👨‍⚕️ **Doctor (Static)** | [https://prince53454.github.io/mediconnect-doctor/](https://prince53454.github.io/mediconnect-doctor/) |
| ⚙️ **Admin (Static)** | [https://prince53454.github.io/mediconnect-admin/](https://prince53454.github.io/mediconnect-admin/) |
| 🔐 **Register** | [https://prince53454.github.io/register/](https://prince53454.github.io/register/) |


## 🔐 Configuration and deployment

- Create `server/.env` with a private MongoDB `MONGODB_URI`, a unique `JWT_SECRET` of at least 32 characters, and the production client origin in `CLIENT_URL`. Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Do not put server values in `client/.env`.
- Set `VITE_API_URL` for the client build. `VITE_SOCKET_URL` is optional and defaults to the API host with `/api` removed. Legacy `REACT_APP_*` client variables are still accepted during migration. Demo data is disabled by default; only enable it for an isolated showcase build with `VITE_DEMO_MODE=true`. GitHub Pages builds use a relative base path automatically.
- Configure provider credentials before enabling their features: Razorpay or Stripe for payments, SMTP for email, Daily.co for hosted video rooms, and Cloudinary for managed uploads. Production does not report placeholder email, video, or file-upload results as successful; unavailable providers fail explicitly. Payment routes also return `503` instead of confirming a mock payment.
- Render deployments require `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` to be added as private environment variables in the Render dashboard; add provider credentials there too before enabling those features.
- Rotate any JWT/database credentials that were previously committed or shared. Demo seeding is blocked in production.
- To run the local container stack, create a root ignored `.env` with the variables required by `docker-compose.yml`. Set `MONGODB_URI` to the `mongodb` Compose service using the configured root credentials, then run `docker compose up --build`. The app and MongoDB ports are bound to localhost.

## ✨ Features

### Patient Portal
- 🔍 Search & book doctors by specialty, city, rating
- 🤖 AI Symptom Checker with auto-booking
- 📹 Video Consultation (WebRTC)
- 💬 Chat Consultation (real-time)
- 💊 Online Pharmacy with cart & delivery
- 🔬 Lab Test booking
- 📊 Health Metrics Tracking (BP, sugar, weight)
- 📋 Medical Records & Prescriptions
- 📞 Call History & Chat History

### Doctor Portal
- 📊 Dashboard with appointments, patients, earnings
- 📅 Manage appointments (confirm, cancel, reschedule)
- 💬 Chat & video consultations
- 💰 Earnings dashboard with charts
- 📋 Consultation notes & prescriptions

### Admin Panel
- 📊 Full dashboard with stats & charts
- 👨‍⚕️ Approve/reject doctors
- 📅 Manage all appointments
- 👥 Manage all users
- 💰 Revenue tracking & doctor payouts
- ⚙️ 14-tab settings panel

### Platform
- 🔐 JWT authentication with role-based access
- 📧 Email notifications (appointment, payment, reminders)
- 🔔 Real-time Socket.IO notifications
- 💳 Razorpay + Stripe payments (development mock mode only; production requires configured provider credentials)
- 🤖 AI-powered symptom analysis
- 🆘 Emergency SOS feature
- 📱 Mobile responsive design

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Socket.IO Client |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB 7 |
| Video | WebRTC + Daily.co |
| Payments | Razorpay + Stripe |
| Real-time | Socket.IO |
| Build | Docker |

## 📁 Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/       # All page components
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth, Language, Notifications
│   │   └── services/    # API service (axios)
│   └── build/           # Production build
├── server/              # Express backend
│   ├── controllers/     # Request handlers
│   ├── routes/          # 15 API route files
│   ├── models/          # 14 Mongoose models
│   ├── middleware/       # Auth middleware
│   ├── services/        # Email, Payment, Notification services
│   ├── seeds/           # Database seeder
│   └── tests/           # Jest test suites
└── Dockerfile           # HF Spaces deployment
```

## 🧪 Tests

```bash
cd server && npm test
# Jest/Supertest suites for authentication, consultations, appointments, and payments
```

## 📄 License

MIT
