````markdown
<p align="center">
  <img src="tugma-frontend/src/assets/tugma_2.png" alt="Tugma Logo" width="220">
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
# Add your VITE_CLOUDINARY keys to .env
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

```

-----

### A few tips for you:

  * **The Logo:** Since you mentioned using **Cloudinary**, just upload your logo there, copy the "Permanent Link," and paste it into the `src=""` attribute of the first `<img>` tag.
  * **The Badges:** I included a **Gemini** badge and a **TypeScript** one since those are huge pluses for your project's technical "wow factor."
  * **Alignment:** Using the `<p align="center">` tag keeps everything neat and professional looking on the GitHub landing page.

Would you like me to help you write the **detailed features list** for each module (Student/Employer/Admin) to make the README even longer and more impressive?
```
