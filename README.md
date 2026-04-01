🚀 TaskFlow – Collaborative Task & Project Management System
TaskFlow is a modern, full-stack project management application designed to help teams organize workflows, track tasks, and collaborate effectively. It features a robust drag-and-drop Kanban board, role-based access control, activity tracking, and real-time notifications.

🌐 Live Demo (In Progress)
Project Link: https://taskflow-webapp.onrender.com

⚠️ Status: Currently building on Render. UI updates and performance patches are being deployed daily.

💡 The Problem & The Solution
The Problem: Many small teams struggle with "information silos"—where task updates are buried in chat apps or lost in static spreadsheets. This leads to missed deadlines, double-work, and a lack of accountability.

The Solution: TaskFlow provides a centralized source of truth. By combining a visual Kanban board with an automated Activity Log, every team member knows exactly:

What needs to be done.

Who is working on it.

When the status last changed.

✨ Core Features
🔐 Authentication & Security: Secure user registration and login using JSON Web Tokens (JWT). Passwords are cryptographically hashed.

👥 Role-Based Access Control (RBAC): Strict workspace permissions. Admins manage projects and invites; Members interact with assigned tasks.

📋 Kanban Task Management: Seamlessly move tasks across 'To Do', 'In Progress', and 'Done' columns using a fluid drag-and-drop interface.

🔔 Smart Notifications: In-app notification bell for task assignments and due-date reminders.

⏱️ Activity Logging: A chronological "paper trail" of every change made within a project to ensure team accountability.

🔍 Advanced Filtering: Instantly filter tasks by Status, Priority, or Assignee to find exactly what you need.

💬 Task Collaboration: Leave comments and updates directly on task cards for context-specific communication.

🏗️ Architecture & Tech Stack
TaskFlow uses a Decoupled Client-Server Architecture to ensure scalability and a snappy user experience.

Frontend (Client)
React.js (Vite): Powering a responsive Single Page Application (SPA).

@dnd-kit: Used for the specialized drag-and-drop Kanban logic.

Axios Interceptors: Automatically handles JWT token refreshes and secure API headers.

State Management: React Context and Hooks for efficient data flow.

Backend (API)
Django & DRF: A robust Python-based REST API that handles business logic and security.

JWT Auth: Stateless authentication for secure cross-origin communication.

Relational Database: Designed with optimized schemas for Users, Projects, and Tasks.

📖 User Guide: How to Collaborate
To test the collaborative power of TaskFlow, follow this flow:

Create & Invite: Register as User A and create a new project. Use the Project Settings to invite User B via their registered email.

Assign Tasks: Create a task and assign it to User B.

Live Tracking: Log in as User B in an incognito window. Move the task to "In Progress."

Audit Trail: As User A, refresh your project board and check the Activity Log to see the timestamp of User B's update.

🛠️ Local Setup Instructions
1. Backend (Django)
Bash
cd taskflow_backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
2. Frontend (React)
Bash
cd taskflow_frontend
npm install
npm run dev
🚧 Project Status & Future Roadmap
TaskFlow is currently in Active Development.

✅ Core Kanban and Auth features complete.

🔄 Current Focus: Optimizing Render deployment and refining the mobile responsive CSS.

🔜 Upcoming: Real-time WebSocket updates and automated email reminders.
