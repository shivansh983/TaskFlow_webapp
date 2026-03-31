# TaskFlow_webapp
TaskFlow is a modern task and project management system built with React and Django. It allows teams to easily create projects, assign user roles, and track progress in real-time. With features like a drag-and-drop Kanban board, activity logging, and secure role-based access, TaskFlow keeps teams aligned and productive. (Under development)


# 🚀 TaskFlow – Collaborative Task & Project Management System

TaskFlow is a modern, full-stack project management application designed to help teams organize workflows, track tasks, and collaborate effectively. It features a robust drag-and-drop Kanban board, role-based access control, activity tracking, and real-time notifications.

## ✨ Core Features

* **🔐 Authentication & Security:** Secure user registration and login using JSON Web Tokens (JWT). Passwords are cryptographically hashed.
* **👥 Role-Based Access Control (RBAC):** Strict workspace permissions. Admins can manage projects and invite users, while Members can interact with assigned tasks.
* **📋 Kanban Task Management:** Create, edit, delete, and move tasks seamlessly across status columns using a drag-and-drop interface.
* **🔔 Smart Notifications:** In-app notification bell tracking unread alerts and due-date reminders.
* **⏱️ Activity Logging:** Detailed, chronological tracking of project events (who updated what, and when).
* **🔍 Advanced Filtering & Search:** Instantly filter tasks by Status, Priority, Assignee, or search by keyword.
* **💬 Task Collaboration:** Users can leave comments and updates on specific task cards.

---

## 🛠️ Tech Stack Explanation

This project is built using a modern, decoupled architecture, separating the client interface from the API logic.

### **Frontend (Client)**
* **Framework:** React.js (via Vite)
* **Routing & State:** React Hooks (`useState`, `useEffect`) and Context
* **API Integration:** Axios (with automated JWT interceptors)
* **Drag-and-Drop:** `@dnd-kit/core` and `@dnd-kit/sortable` for fluid Kanban interactions
* **Styling:** Custom CSS utilizing a modern "Slate & Indigo" design system with responsive flexbox/grid layouts.

### **Backend (API)**
* **Framework:** Python / Django 
* **API Architecture:** Django REST Framework (DRF)
* **Authentication:** `djangorestframework-simplejwt` for stateless token-based auth
* **Database:** PostgreSQL (or SQLite for local development)

---

## 🏗️ Architecture Overview

TaskFlow utilizes a **Client-Server Architecture**:
1. **The React Frontend** acts as a Single Page Application (SPA). It manages the UI state and handles complex user interactions (like dragging tasks) locally to ensure a snappy user experience.
2. **The Django Backend** serves purely as a RESTful JSON API. It enforces business logic, validates data, manages database relationships (Users -> Projects -> Tasks), and ensures that users only access data they are authorized to see.
3. **Authentication Flow:** Upon login, the backend issues an Access and Refresh JWT. The frontend stores these and attaches the Access token to the `Authorization` header of all subsequent API requests via an Axios interceptor.

---

## 💻 Local Setup Instructions

Follow these steps to run TaskFlow locally on your machine.

### Prerequisites
* Node.js (v16+)
* Python (v3.9+)

### 1. Backend Setup (Django)
Open a terminal and navigate to your backend directory:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Start the API server
python manage.py runserver
