# 🏢 Society Management System

A full-stack society/apartment management system built using:

- **React JS (Frontend)**
- **Node.js + Express (Backend)**
- **MySQL (Database)**

This system helps societies manage:
✔ Users  
✔ Expenses  
✔ Payments  
✔ Roles (Admin / Manager / Member)  
✔ Secure Login + JWT  
✔ Dashboard & Reports  

---

## 📂 Project Structure

society-management-system/
│
├── backend/
│ ├── controllers/
│ ├── routes/
│ ├── config/
│ ├── middleware/
│ ├── package.json
│ └── server.js
│
└── frontend/
├── src/
├── public/
├── package.json
└── vite.config.js / CRA config

---

## 🚀 Getting Started

### 1️⃣ Clone Repo

git clone https://github.com/adityaSharma21111992/society-management-system.git
cd society-management-system

yaml
Copy code

---

## 🖥️ Backend Setup

cd backend
npm install

markdown
Copy code

Create `.env` inside **backend**:

PORT=5000
JWT_SECRET=your_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=society
ADMIN_PASS=your_admin_pass

sql
Copy code

Start backend:

npm run dev

yaml
Copy code

---

## 🌐 Frontend Setup

cd frontend
npm install
npm run dev

yaml
Copy code

---

## 🔐 Authentication System

- JWT-based authentication  
- Role-based access:  
  - **Admin** → Can manage all users  
  - **Manager** → Can manage expenses  
  - **User** → Basic access  

---

## 🧪 Testing Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin@society.com | (set in .env → ADMIN_PASS) |

---

## 📦 Deployment Guides

### 🚀 Deploy Backend  
Use free services like  
- Railway  
- Render  
- DigitalOcean  
- AWS Lightsail  

### 🌐 Deploy Frontend  
- GitHub Pages  
- Netlify  
- Vercel  

---

## 📘 License

MIT License © 2025 — **Aditya Sharma**

---

## 🤝 Contributing

PRs, issues and feature requests are welcome!

---

## ❤️ Special Thanks

Made with care for apartment societies 🏠✨
