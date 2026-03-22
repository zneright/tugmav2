# Tugma Platform

Tugma is an integrated On-the-Job Training (OJT) and AI-powered job-matching ecosystem. It bridges the gap between students seeking internships, employers looking for talent, and administrators overseeing the process, directly supporting __SDG 8: Decent Work and Economic Growth__.

---

## Tech Stack

__Frontend__
- __React.js (Vite)__ with __TypeScript (.tsx)__
- __Tailwind CSS__ (Styling)

__Backend & Database__
- __CodeIgniter 4__ (REST API)
- __MySQL__ (Relational Database)

__Third-Party APIs & Cloud Services__
- __Firebase:__ Secure User Authentication (Google SSO & Email/Password)
- __Cloudinary:__ Cloud storage for profile images and resume (PDF) uploads
- __Gemini API:__ AI engine powering the Applicant Scanner, Smart Job Matchmaker and Employer ATS Resume Scanner

---

## System Features

### Authentication
- __User Login:__ Secure access via Google Single Sign-On (SSO) or standard Email and Password credentials.

### Student Module
- __Dashboard:__ View personal statistics, access onboarding checklist, and quick-print Daily Time Record (DTR).
- __Find Jobs:__ Browse postings, receive __AI-powered job matching recommendations__, and submit applications with integrated data consent for resume sharing.
- __OJT & DTR Tracker:__ Log daily time entries, generate/print DTR reports, and use a dynamic calculator predicting the expected OJT end date based on inputted hours and schedule.
- __Messaging & Connections:__ Direct messaging with employers via Inbox, manage pending job offers (accept/reject), and navigate to detailed Company Profiles to view employer information/open roles.
- __Profile & Resume Management:__ Manage personal details, upload/update resumes, and use the __ATS Scanner__ to test resumes against job descriptions (with historical scan results).
- __Notifications & Help:__ Receive system/employer alerts, access FAQs, and submit/track customer support tickets.

### Employer Module
- __Dashboard / Overview:__ View company statistics and active job posting metrics.
- __Job Management:__ Create and manage job postings. Toggle listing statuses between Draft, Published, or Closed.
- __Applicants:__ View the complete pool of applicants per job. Run __Alignment Scans__ on applicants (evaluating fit with or without an attached resume). Update statuses (Reject or Send Offer), direct message applicants, and print applicant details/resumes.
- __Messages:__ Message directly with student applicants. View a roster of all hired students in __Connected Students__ and access/print their DTRs.
- __Company Profile:__ Manage and update public-facing company details.
- __Notifications & Help:__ Receive system alerts, broadcast direct notifications to specific students, access FAQs, and submit support tickets.

### Admin & Super Admin Modules
- __Dashboard:__ View system statistics and platform analytics.
- __User Management:__ Manage/moderate user accounts, archive inactive or flagged users, and export user data to PDF or Excel formats.
- __System Alerts:__ Broadcast platform-wide notifications to both students and employers.
- __Customer Service:__ View, manage, and reply to support tickets submitted by students and employers.
- __Reporting & Audit Trail:__ Track and view complete system activity logs across all roles.
- __Super Admin (Extra Features):__ Elevated user control to create new Admin accounts and archive existing Admin accounts.

---

## Local Installation & Setup

### Prerequisites
Make sure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [PHP](https://www.php.net/) (v7.4 or v8.1+ for CodeIgniter 4)
- [Composer](https://getcomposer.org/)
- Local Web Server (XAMPP, WAMP, Laragon, etc.) with MySQL

__Import the Database:__
Download the database SQL file from this Google Drive link: [Download tugma_db.sql Here](https://drive.google.com/drive/folders/1LaJzPEQwE9I_oCJ3fYR9vWqfLQO4AvCg). Import this file into your local MySQL server (via phpMyAdmin or your preferred database tool).

### 1. Backend Setup (CodeIgniter 4)

1. Navigate to your backend directory:
   ```bash
   cd tugma-backend
Install PHP dependencies:

Bash
composer install
Set up your environment variables: Copy the env file and rename it to .env. Open .env and configure your database and environment:

Code snippet
CI_ENVIRONMENT = development
database.default.hostname = localhost
database.default.database = tugma_db
database.default.username = root
database.default.password = 
database.default.DBDriver = MySQLi
Start the CodeIgniter development server:

Bash
php spark serve
The backend API will run on http://localhost:8080.

2. Frontend Setup (React Vite TSX)
Navigate to the frontend directory:

Bash
cd frontend
Configure your Firebase settings: Open your firebase.js file located in your src directory and update the configuration block with your own Firebase project credentials if needed.

JavaScript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
Configure Cloudinary:

Create a free account at Cloudinary.

Locate your "Cloud Name" on the main dashboard.

Navigate to Settings > Upload and create an "Upload Preset" (ensure the signing mode is set to "Unsigned").

Update your configuration file or .env with your new credentials:

Code snippet
VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
VITE_CLOUDINARY_UPLOAD_PRESET="your_upload_preset"
Configure Gemini API:

Obtain a free API key from Google AI Studio.

Add the key to ats.php, applicants.php, and aisearch.php inside the controllers/api folder (API_KEY="YOUR_API_KEY_HERE").

Start the Vite development server:

Bash
npm run dev
The frontend application will run on http://localhost:5173

Contribution & License
Built by IT Students for InterCICSkwela Hackathon Challenge 2026.
