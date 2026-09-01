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
| 🧠 **Alzheimer's Detection** | [https://alzheimer-s-detection-wi4c.onrender.com](https://alzheimer-s-detection-wi4c.onrender.com) |

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@mediconnect.com | admin123 |
| **Patient** | patient@mediconnect.com | patient123 |
| **Doctor** | dr.rajesh@mediconnect.com | doctor123 |

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
- 💳 Razorpay + Stripe payments (mock mode)
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
# 38 tests across 3 test suites (auth, appointments, payments)
```

## 📄 License

MIT
