<p align="center">
  <img src="src/assets/tugma_2.png" alt="Tugma Logo" width="220">
</p>

<h1 align="center">Tugma Platform</h1>

<p align="center">
  <strong>An Integrated OJT & AI-Powered Job-Matching Ecosystem</strong><br>
  Supporting <em>SDG 8: Decent Work and Economic Growth</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TS">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/CodeIgniter-EF4223?style=for-the-badge&logo=codeigniter&logoColor=white" alt="CI4">
  <img src="https://img.shields.io/badge/MySQL-00000f?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white" alt="Firebase">
  <img src="https://img.shields.io/badge/Gemini_AI-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini">
</p>

---

## 🌟 Overview

**Tugma** is an integrated platform designed to streamline the On-the-Job Training (OJT) process. Built for the **InterCICSkwela Hackathon Challenge 2026**, it directly supports **SDG 8: Decent Work and Economic Growth** by providing:

* **AI-Powered Matching:** Smart job recommendations using the Gemini API.
* **ATS Resume Scanner:** Helping students optimize their resumes for specific job descriptions.
* **DTR Management:** Automated time tracking and end-date prediction for OJT hours.
* **Three-Way Ecosystem:** Dedicated modules for Students, Employers, and Admins.

---

## ⚙️ System Features

### 🔐 Authentication
* **Secure Access:** Seamless login via Google Single Sign-On (SSO) or standard Email/Password credentials powered by Firebase.

### 🎓 Student Module
* **Interactive Dashboard:** View personal OJT statistics, onboarding checklists, and quick-print Daily Time Records (DTR).
* **AI-Powered Job Board:** Browse postings and receive smart job matching recommendations using Gemini AI.
* **OJT & DTR Tracker:** Log daily hours, generate reports, and use a dynamic calculator to predict the exact OJT completion date.
* **ATS Resume Scanner:** Test uploaded resumes against specific job descriptions to check alignment scores before applying.
* **Messaging & Connections:** Direct message employers, manage pending job offers, and explore detailed company profiles.

### 🏢 Employer Module
* **Employer Dashboard:** Track active job postings and overall company engagement metrics.
* **Job Management:** Create, publish, draft, or close job listings easily.
* **Applicant Tracking System (ATS):** View the applicant pool and run **Alignment Scans** (with or without resumes) to instantly find the best fit.
* **Student Roster & DTR Access:** Manage hired students, access their submitted DTRs, and direct message applicants.
* **Company Profile:** Update public-facing company details to attract top student talent.

### 🛡️ Admin & Super Admin Modules
* **Platform Analytics:** View system-wide statistics and activity metrics.
* **User Management:** Moderate accounts, archive flagged users, and export user data to PDF or Excel.
* **System Broadcasts:** Send platform-wide alerts and notifications to students and employers.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React.js (Vite)
- **Language:** TypeScript (.tsx)
- **Styling:** Tailwind CSS

### Backend & Database
- **Framework:** CodeIgniter 4 (REST API)
- **Database:** MySQL (Relational)

### Cloud & Services
- **Auth:** Firebase (Google SSO & Email/Pass)
- **Storage:** Cloudinary (Images & PDF Resumes)
- **AI Engine:** Google Gemini API

---

## 🚀 Local Installation

### Prerequisites
- Node.js (v18+)
- PHP (v8.1+) & Composer
- Local Server (XAMPP/Laragon)

### 1. Backend Setup (CodeIgniter)
```bash
cd tugma-backend
composer install
cp env .env
# Configure your DB in .env then:
php spark serve
````

### 2\. Frontend Setup (React)

```bash
cd frontend
npm install
# Add your VITE_CLOUDINARY keys and Firebase config to .env
npm run dev
```

-----

## 👥 The Team

| Role | Member |
| :--- | :--- |
| **Backend Lead** | Renz Jericho Buday |
| **Frontend Lead** | Nishia Pinlac |
| **Ideation & Media** | Liezl Casabuena |

-----

\<p align="center"\>
Built with 💜 for InterCICSkwela 2026
\</p\>

