🚀 TaskFlow
The Intelligent Collaborative Task & Project Management System
[
[
[
[

TaskFlow eliminates "information silos" in small teams by merging a fluid drag-and-drop Kanban interface with a robust Django REST API. Your centralized "source of truth" for project progress and team accountability.

Live Demo: https://taskflow-webapp.onrender.com
Note: Free-tier instances may take ~50s to wake up on first visit

💡 Why TaskFlow?
The Problem
Small teams lose track of "who is doing what" because updates are buried in:

💬 Chat logs

📊 Static spreadsheets

❌ Missed deadlines & overlapping work

The Solution
TaskFlow provides a Visual Audit Trail:

✅ Every task movement tracked

👥 Every role clearly defined

🔄 Real-time updates & status visualization

✨ Core Features
Feature	Description
🔐 Secure Auth	JWT-based authentication with hashed passwords
📋 Kanban Board	Fluid drag-and-drop powered by @dnd-kit
👥 Team RBAC	Role-Based Access Control (Admins vs Members)
⏱️ Activity Log	Chronological history of every project change
🔔 Smart Alerts	In-app notifications for assignments & deadlines
🔍 Power Search	Filter by priority, status, or assignee instantly
🏗️ Technical Architecture
text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Django REST    │◄──►│  PostgreSQL     │
│  React 18 +     │    │     API          │    │                 │
│   Vite + Axios  │    │  + SimpleJWT     │    │  Users/Projects │
└─────────────────┘    └──────────────────┘    │     + Tasks     │
                                                └─────────────────┘
Frontend: React 18 (Vite) - Axios Interceptors - Responsive "Slate & Indigo" Design
Backend: Django REST Framework - SimpleJWT - PostgreSQL

📖 Quick Start Guide
🔗 Multi-User Test Flow (Try this!)
Host: Register as User A → Create "TaskFlow Demo" project

Invite: Project Settings → Invite User B (secondary email)

Assign: Create "High Priority" task → Assign to User B

Collaborate: Login as User B (Incognito) → Drag task to "Done"

Verify: User A checks Activity Log → See exact timestamp!

🛠️ Local Installation
Backend (Django)
bash
cd taskflow_backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
Frontend (React)
bash
cd taskflow_frontend
npm install
npm run dev
🚧 Roadmap
Status	Feature	Priority
✅	Core Kanban drag-and-drop	High
✅	Secure JWT Auth System	High
🔄	Render deployment optimization	High
⏳	Real-time WebSockets (Django Channels)	Medium
⏳	Email reminders & notifications	Medium
