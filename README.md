# Tugma Platform



Tugma is an integrated On-the-Job Training (OJT) and AI-powered job-matching ecosystem. It bridges the gap between students seeking internships, employers looking for talent, and administrators overseeing the process, directly supporting __SDG 8: Decent Work and Economic Growth__.

### Prerequisites
Ensure you have the following installed:
* **Node.js** (v18+)
* **PHP** (v8.1+ recommended for CodeIgniter 4)
* **Composer**
* **Local Web Server** (XAMPP, Laragon, or MAMP) with **MySQL**



---

### 1. Backend Setup (CodeIgniter 4)

First, handle the database and server-side dependencies.

**Database Import:**
1. Download `tugma_db.sql` from the provided [Google Drive link](https://drive.google.com/drive/folders/1LaJzPEQwE9I_oCJ3fYR9vWqfLQO4AvCg).
2. Import it into your local MySQL server via phpMyAdmin or your terminal.

**Server Configuration:**
```bash
# Navigate to the backend directory
cd tugma-backend

# Install PHP dependencies
composer install

# Initialize environment variables
cp env .env
```

Open `.env` and configure your database settings:
```ini
CI_ENVIRONMENT = development
database.default.hostname = localhost
database.default.database = tugma_db
database.default.username = root
database.default.password = 
database.default.DBDriver = MySQLi
```

**Run the Backend:**
```bash
php spark serve
```
> The API will now be live at `http://localhost:8080`.

---

### 2. Frontend Setup (React + Vite + TS)

Now, configure the client-side environment and third-party integrations.

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install
```

**Integration Configs:**

1.  **Firebase:** Update `src/firebase.js` with your Firebase project credentials.
2.  **Cloudinary:** Ensure your `.env` file in the frontend folder includes:
    ```bash
    VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
    VITE_CLOUDINARY_UPLOAD_PRESET="your_upload_preset"
    ```
3.  **Gemini API:** Insert your key from Google AI Studio into the following backend controllers:
    * `controllers/api/ats.php`
    * `controllers/api/applicants.php`
    * `controllers/api/aisearch.php`

**Run the Frontend:**
```bash
# Start the Vite development server
npm run dev
```
> The application will be accessible at `http://localhost:5173`.

---

### 🛠 Tech Stack Summary

| Layer | Technology | Key Use Case |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + TS | Fast, type-safe UI |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Backend** | CodeIgniter 4 | Lightweight RESTful API |
| **Database** | MySQL | Relational data management |
| **AI Engine** | Gemini API | Job matching & ATS scanning |
| **Storage** | Cloudinary | PDF & Image hosting |

Would you like me to help you draft a **README.md** file based on this content, or perhaps generate a **system architecture diagram** description for your documentation?
