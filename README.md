<p align="center">
  <img src="tugma-frontend/src/assets/tugma_2.png" alt="Tugma Logo" width="220">
</p>

<h1 align="center">Tugma Platform</h1>

<p align="center">
  <strong>Tugma is an integrated On-the-Job Training (OJT) and AI-powered job-matching ecosystem. It bridges the gap between students seeking internships, employers looking for talent, and administrators overseeing the process, directly supporting **SDG 8: Decent Work and Economic Growth**.</strong><br>
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
* **Dashboard:** View personal statistics, access onboarding checklist, and quick-print Daily Time Record (DTR).
* **Find Jobs:** Browse postings, receive **AI-powered job matching recommendations**, and submit applications with integrated data consent for resume sharing.
* **OJT & DTR Tracker:** Log daily time entries, generate/print DTR reports, and use a dynamic calculator predicting the expected OJT end date based on inputted hours and schedule.
* **Messaging & Connections:** Direct messaging with employers via Inbox, manage pending job offers (accept/reject), and navigate to detailed Company Profiles to view employer information/open roles.
* **Profile & Resume Management:** Manage personal details, upload/update resumes, and use the **ATS Scanner** to test resumes against job descriptions (with historical scan results).
* **Notifications & Help:** Receive system/employer alerts, access FAQs, and submit/track customer support tickets.

### 🏢 Employer Module
* **Dashboard / Overview:** View company statistics and active job posting metrics.
* **Job Management:** Create and manage job postings. Toggle listing statuses between Draft, Published, or Closed.
* **Applicants:** View the complete pool of applicants per job. Run **Alignment Scans** on applicants (evaluating fit with or without an attached resume). Update statuses (Reject or Send Offer), direct message applicants, and print applicant details/resumes.
* **Messages:** Message directly with student applicants. View a roster of all hired students in **Connected Students** and access/print their DTRs.
* **Company Profile:** Manage and update public-facing company details.
* **Notifications & Help:** Receive system alerts, broadcast direct notifications to specific students, access FAQs, and submit support tickets.

### 🛡️ Admin & Super Admin Modules
* **Dashboard:** View system statistics and platform analytics.
* **User Management:** Manage/moderate user accounts, archive inactive or flagged users, and export user data to PDF or Excel formats.
* **System Alerts:** Broadcast platform-wide notifications to both students and employers.
* **Customer Service:** View, manage, and reply to support tickets submitted by students and employers.
* **Reporting & Audit Trail:** Track and view complete system activity logs across all roles.
* **Super Admin (Extra Features):** Elevated user control to create new Admin accounts and archive existing Admin accounts.

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

````
#### Set up environment variables: Copy the env file and rename it to .env. Open .env and configure your database and environment:
```bash
CI_ENVIRONMENT = development
database.default.hostname = localhost
database.default.database = tugma_db
database.default.username = root
database.default.password = 
database.default.DBDriver = MySQLi
```
# Start the CodeIgniter development server:
```bash
php spark serve
```
   *The backend API will run on http://localhost:8080.* 


### 2. Frontend Setup (React Vite TSX)

```bash
cd frontend
npm install

```

# Configure your Firebase settings: Open your firebase.js file located in your src directory and update the configuration block with your own Firebase project credentials if needed.
```bash
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
```

# Configure Cloudinary:
   * Create a free account at [Cloudinary](https://cloudinary.com).
   * Locate your "Cloud Name" on the main dashboard.
   * Navigate to Settings > Upload and create an "Upload Preset" (ensure the signing mode is set to "Unsigned").
   * Update your configuration file or `.env` with your new credentials:
     ```env
     VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
     VITE_CLOUDINARY_UPLOAD_PRESET="your_upload_preset"
     ```
# Configure Gemini API:
   * Obtain a free API key from Google AI Studio.
   * Add the key to `ats.php`, `applicants.php`, and `aisearch.php` inside the `controllers/api` folder (`API_KEY="YOUR_API_KEY_HERE"`).

# Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will run on http://localhost:5173.*

-----

## 👥 The Team

| Role | Member |
| :--- | :--- |
| **Backend Lead** | Renz Jericho Buday |
| **Frontend Lead** | Nishia Pinlac |
| **Ideation & Media** | Liezl Casabuena |

-----

<p align="center"\>
Built with 💜 for InterCICSkwela 2026
</p\>

