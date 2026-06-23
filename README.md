# 🧠 AI Timetable Generator:-

> An intelligent timetable generation system using Genetic Algorithm optimized for educational institutions.

---

## 📋 Table of Contents:-

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Guide](#usage-guide)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Team](#team)
- [License](#license)

---

## 🌟 Overview:-

The **AI TimeTable Generator** is a specialized solution for different educational institutions that automatically creates conflict-free academic timetables using a **Genetic Algorithm**. It handles real college data including multiple departments, faculty availability, lab sessions, and various constraints respectively and in this case the data was gathered specifically from our MVGR College.

### Why This Project?

|       Challenges         |     Traditional Approach     |       Our Solution        |
|--------------------------|------------------------------|---------------------------|
| Manual scheduling        | Takes weeks, prone to errors | Automated in minutes      |
| Faculty conflicts        | Double-booking common        | Zero conflicts guaranteed |
| Lab scheduling           | Overlaps with theory         | Intelligent lab blocking  |
| Workload balance         | Uneven distribution          | Balanced allocation       |
| Sports/Library placement | Adjacent scheduling          | Smart separation          |

---

## 🚀 Features:-

### Core Features:

- ✅ **Genetic Algorithm optimization** for optimal timetables
- ✅ **Real MVGR college data** - Departments, Faculty, Subjects
- ✅ **Multiple departments** support (IT, CSIT, CSE, ECE, EEE)
- ✅ **Even semesters only** (2, 4, 6 - as per MVGR schedule)
- ✅ **Smart scheduling** - 9:00 AM to 4:00 PM
- ✅ **Lab block handling** - Complete slot blocking
- ✅ **Activity management** - Sports not adjacent to Library/Counselling
- ✅ **Faculty assignment** based on availability and expertise
- ✅ **Export/Print functionality** - Share timetables easily

### Constraint Handling:

|    Constraint Type     |                    Examples                      |    Penalty   |
|------------------------|--------------------------------------------------|--------------|
| **Hard Constraints**   | No lab-theory overlap, 7 periods/day             | -500 to -150 |
| **Medium Constraints** | No consecutive activities, No duplicate subjects | -100 to -50  |
| **Soft Constraints**   | Subject appears exactly 3 times/week             | -30 each     |

---

## 🛠️ Technology Stack:-

### Backend:
Node.js - JavaScript runtime
Express.js - Web framework
MongoDB - NoSQL database
Mongoose - ODM for MongoDB

### Frontend:
HTML5 - Structure
CSS3 - Styling
JavaScript - Interactive features
Python HTTP - Local server

### Development:
VS Code - Source code editor
Git - Version control
Git Bash - Terminal for Window

---

## 📁 Project Structure:-

AI-Timetable-Generator/
<br>
│
├── backend/ # Node.js Backend
<br>
│ ├── models/ # MongoDB Models
<br>
│ │ ├── Faculty.js # Faculty schema
<br>
│ │ ├── Timetable.js # Timetable schema
<br>
│ │ └── Department.js # Department schema
<br>
│ │
│ ├── routes/ # API Routes
<br>
│ │ └── timetable.js # Timetable endpoints
<br>
│ │
│ ├── genetic-algorithm/ # AI Algorithm Core
<br>
│ │ └── scheduler.js # Main GA scheduler
<br>
│ │ 
│ ├── scripts/ # Utility Scripts
<br>
│ │ ├── load-real-college-data.js # Import college data
<br>
│ │ ├── simple-init.js # Test DB connection
<br>
│ │ ├── start-mongodb.sh # Start MongoDB
<br>
│ │ └── stop-mongodb.sh # Stop MongoDB
<br>
│ 
├── server.js # Main Server (port 5000)
<br>
├── package.json # Dependencies
<br>
├── .env # Environment Variables
<br>
│
├── frontend/ # Web Interface
<br>
│ ├── index.html # Main page
<br>
│ ├── style.css # Styling
<br>
│ └── script.js # Frontend logic
<br>
│
├── data/ # Data directory
<br>
│ └── db/ # MongoDB data (auto-created)
<br>
│
├── README.md # This file
<br>
└── .gitignore # Git ignore file
<br>

---

## 📦 Installation:-

### Prerequisites:

| Software | Version|                        Download Link                          |
|----------|--------|---------------------------------------------------------------|
| Node.js  | v16+   | [nodejs.org](https://nodejs.org/)                             |
| MongoDB  | v6+    | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Git Bash | Latest | [git-scm.com](https://git-scm.com/downloads)                  |
| VS Code  | Latest | [code.visualstudio.com](https://code.visualstudio.com/)       |
| Python   | v3+    | [python.org](https://python.org/)                             |

### Step 1: Verify Installation
```bash
# Check installed versions
node --version        # Should show v16+
npm --version         # Should show v8+
mongod --version      # Should show MongoDB version
python --version      # Should show Python 3+
git --version         # Should show Git version


Step 2: Project Setup
# Extract project to desired location
# Example: C:\Users\YourName\AI-Timetable-Generator

# Navigate to project
cd /c/Users/YourName/AI-Timetable-Generator

# Install backend dependencies
cd backend
npm install

# This will install all required packages:
# - express, mongoose, dotenv, cors
# - nodemon (dev dependency)


Step 3: Create Data Directory
# Create MongoDB data directory
cd backend
mkdir -p data/db



-## 🚀 Quick Start:-

-### Method 1: Manual Start (3 Terminals)

Terminal 1 - MongoDB
cd AI-Timetable-Generator/backend
mkdir -p data/db
mongod --dbpath ./data/db


Terminal 2 - Backend Server
cd AI-Timetable-Generator/backend
npm start


Terminal 3 - Frontend
cd AI-Timetable-Generator/frontend
python -m http.server 8000


Access Application:
Open Browser: http://localhost:8000


-### Method 2: Batch File (Windows)

Create start-all.bat in project root:
@echo off
echo Starting AI Timetable Generator...
echo.

echo [1/3] Starting MongoDB...
start cmd /k "cd backend && mongod --dbpath data\db"

timeout /t 3 >nul

echo [2/3] Starting Backend Server...
start cmd /k "cd backend && npm start"

timeout /t 3 >nul

echo [3/3] Starting Frontend Server...
start cmd /k "cd frontend && python -m http.server 8000"

echo.
echo All servers started!
echo Open browser: http://localhost:8000
pause


-### Method 3: Git Bash (Linux/macOS)

# Start all services in background
cd backend
mkdir -p data/db
mongod --dbpath ./data/db &
npm start &
cd ../frontend
python -m http.server 8000 &

---

-## 📖 Usage Guide:-

-### Step 1: Initialize College Data

Open http://localhost:8000
Click "Initialize College Data" button
Wait for success message (10-15 seconds)
This loads:
Department details
Faculty data
Subject allocations
Lab information


-### Step 2: Generate Timetable

Select Parameters:
Department: IT, CSIT, CSE, ECE, EEE
Semester: 2, 4, 6 (Even semesters only)
Section: A, B (if applicable)
Configure Options:
☑️ Include Sports
☑️ Include Library
☑️ Include Counselling
Click "Generate with AI"
Wait 10-20 seconds
Watch fitness score improve
See generation progress


-### Step 3: View Results

The generated timetable shows:
7 periods per day (9:00 AM - 4:00 PM)
Lab sessions with complete blocking
Activities in afternoon slots
Faculty assignment for each period


-### Step 4: Export/Print

Click Print button for physical copy
Click Export JSON for digital backup
Use Export CSV for Excel/Google Sheets

---

-## 🔌 API Endpoints:-

-### Health Check:
GET /api/timetable/health
Response: {"status":"OK","database":"Connected"}


-### Initialize Data:
POST /api/timetable/initialize
Response: {"success":true,"message":"Data initialized"}


-### Generate Timetable:
POST /api/timetable/generate

Request Body:
{
  "department": "IT",
  "semester": 2,
  "section": "A",
  "options": {
    "sports": true,
    "library": true,
    "counselling": true
    } 
}

Response:
{
  "success": true,
  "data": {
    "timetable": { ... },
    "fitnessScore": 1000,
    "generations": 45
  }
}


-### Export Timetable:
GET /api/timetable/export/:id

---

-## 🔧 Troubleshooting:-

-### MongoDB Won't Start:

# Check if port 27017 is in use
netstat -ano | findstr :27017

# Kill existing process (Windows)
taskkill /PID <PID> /F

# Kill existing process (Linux/macOS)
sudo kill -9 <PID>

# Create data directory
mkdir -p backend/data/db


-### Backend Connection Error:

# Test MongoDB connection
cd backend
node scripts/test-mongo.js

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check MongoDB is running
mongod --version


-### Frontend Not Loading:

# Check Python version
python --version

# Use alternative server
npm install -g http-server
http-server -p 8000

# Or use Python 3 explicitly
python3 -m http.server 8000


-### Port Conflicts:

# Find process using port 5000
netstat -ano | findstr :5000

# Find process using port 8000
netstat -ano | findstr :8000

# Kill process
taskkill /PID <PID> /F

---

-## 📊 Data Loading Scripts:-

-### Load Real College Data:
cd backend
node scripts/load-real-college-data.js

-### This loads:
Faculty data from data/faculty.json
Subject data from data/subjects.json
Department data from data/departments.json


-### Test Database Connection:
cd backend
node scripts/test-mongo.js

---

-## 👥 Team:-

Role:	                        Name:
Project Guide	                Mrs. D. Gayatri
Developer	                    Siddharth Sanjay
Department	                    Information Technology
College	                        MVGR College of Engineering
Batch	                        C02
Roll No	                        22331A0748

---

-## 📚 References:-
Genetic Algorithm implementation inspired by evolutionary optimization.
MVGR College of Engineering academic structure.
ITC (International Timetabling Competition) benchmarks.

---

-## 📄 License:-
This project is licensed under the MIT License - see the LICENSE file for details.

---

-## 🙏 Acknowledgments:-
MVGR College of Engineering for infrastructure.
Department of Information Technology for support.
All faculty members who provided data.

---

-## 📞 Contact:-
Email: siddusanjay2005@gmail.com
Project: GitHub Repository:

