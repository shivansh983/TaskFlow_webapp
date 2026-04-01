# TaskFlow — Collaborative Task & Project Management System

> A production-ready full-stack application for teams to manage projects, assign tasks, and collaborate in real time — with a fluid Kanban board, role-based access, live WebSocket updates, and in-app notifications.

**Live Demo:** [https://taskflow-webapp.onrender.com](https://taskflow-webapp.onrender.com)
> ⚠️ Hosted on Render's free tier — first load may take ~50s to wake the server.

---

## Table of Contents

- [Overview](#overview)
- [Feature Breakdown](#feature-breakdown)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Multi-User Test Flow](#multi-user-test-flow)
- [Roadmap](#roadmap)

---

## Overview

Small teams lose track of progress because updates are buried in chat logs, static spreadsheets, and missed check-ins. TaskFlow solves this with a centralized, real-time workspace where every task movement is tracked, every role is clearly defined, and nothing falls through the cracks.

**Core design goals:**
- Zero-friction onboarding — register, create a project, invite a teammate in under 2 minutes
- Audit trail by default — every task change is logged with user and timestamp
- Role-aware UI — admins and members see different controls, automatically

---

## Feature Breakdown

### Authentication & Authorization
- JWT-based login and registration with token refresh
- Secure password hashing via Django's built-in PBKDF2
- Role-Based Access Control — **Admin** and **Member** roles per project
- Admins can invite users by username or email, assign roles, and remove members

### Project Management
- Create, edit, and delete projects
- Per-project member management with adjustable roles
- Project cards with creation date and member count
- Admins-only delete with permission guard on both frontend and backend

### Task Management
- Full task model: title, description, status, priority, due date, assignee
- Drag-and-drop Kanban board (To Do → In Progress → Done) powered by `@dnd-kit`
- Click any task to open a detail modal — edit, update status, or comment
- Admins: full edit + delete access
- Members: status updates + comments

### Real-Time Collaboration
- Django Channels (WebSockets) for live task updates across all connected clients
- Activity log per project — every create, update, delete, comment, and drag is recorded with actor username and timestamp
- Broadcast events: `task_created`, `task_updated`, `task_deleted`, `task_due_reminder`

### Notifications
- In-app notification bell with unread count badge
- Triggered on: task assignment, assignment change, due date approaching
- Email notifications via Django's mail backend (configurable SMTP)
- Mark individual or all notifications as read

### Search & Filtering
- Live search across task titles and descriptions
- Filter by status (To Do / In Progress / Done)
- Filter by priority (Low / Medium / High)
- Filters stack — combine search + status + priority simultaneously
- Result count updates in real time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Axios, @dnd-kit/core |
| Backend | Django 4.x, Django REST Framework |
| Auth | SimpleJWT (access + refresh tokens) |
| Real-Time | Django Channels, Redis (channel layer) |
| Database | PostgreSQL |
| Email | Django SMTP backend |
| Deployment | Render (backend + frontend) |

---

## Architecture

```
┌────────────────────┐        HTTP / WS        ┌──────────────────────┐
│   React 18 (Vite)  │ ◄─────────────────────► │  Django REST API      │
│                    │                          │  + Channels (WS)      │
│  Axios Interceptors│                          │  + SimpleJWT          │
│  @dnd-kit Kanban   │                          └────────┬─────────────┘
│  Context-based     │                                   │
│  auth state        │                          ┌────────▼─────────────┐
└────────────────────┘                          │     PostgreSQL        │
                                                │  users / projects     │
                                                │  tasks / members      │
                                                │  notifications / logs │
                                                └──────────────────────┘
                                                           │
                                                ┌──────────▼───────────┐
                                                │       Redis           │
                                                │  (WebSocket layer)    │
                                                └──────────────────────┘
```

**Request flow:**
1. React sends requests with `Authorization: Bearer <token>` via Axios interceptor
2. Django validates JWT, checks project membership, and applies role-based permissions
3. On any task mutation, Django broadcasts a WebSocket event to all clients in the project's channel group
4. Clients receive the event and re-fetch or patch their local state — no page refresh needed

---

## Database Schema

```
User (custom)
  └── role: admin | member (global)
  └── email, username, password (hashed)

Project
  └── name, description, created_by → User, created_at

ProjectMember
  └── project → Project
  └── user → User
  └── role: admin | member (per-project)

Task
  └── title, description, status, priority, due_date
  └── project → Project
  └── assigned_to → User (nullable)
  └── comments: TextField (newline-delimited with author + timestamp)
  └── created_at, updated_at

Notification
  └── user → User
  └── message, type, is_read
  └── task → Task (nullable)
  └── created_at

ActivityLog
  └── user → User
  └── project → Project
  └── action: CREATE | UPDATE | DELETE | COMMENT
  └── object_type, object_id
  └── changes: JSONField
  └── timestamp
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally (or connection string for hosted DB)
- Redis running locally (for WebSockets — `redis-server`)

### Backend Setup

```bash
cd taskflow_backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Linux / Mac
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create a superuser (optional — for Django admin)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

### Frontend Setup

```bash
cd taskflow_frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:8000`.

---

## Environment Variables

Create a `.env` file in `taskflow_backend/` with the following:

```env
# Django
SECRET_KEY=your-django-secret-key
DEBUG=True

# Database
DATABASE_URL=postgres://user:password@localhost:5432/taskflow

# Redis (for Django Channels)
REDIS_URL=redis://localhost:6379

# Email (optional — for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## API Reference

All endpoints require `Authorization: Bearer <access_token>` unless noted.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register/` | Register a new user |
| POST | `/api/token/` | Login — returns access + refresh tokens |
| POST | `/api/token/refresh/` | Refresh access token |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/` | List projects the user belongs to |
| POST | `/api/projects/` | Create a new project |
| PUT | `/api/projects/{id}/` | Update project details |
| DELETE | `/api/projects/{id}/` | Delete project (admin only) |
| GET | `/api/projects/{id}/members/` | List project members |
| POST | `/api/projects/{id}/invite_user/` | Invite user by username or email |
| PUT | `/api/projects/{id}/update_member_role/` | Change a member's role |
| DELETE | `/api/projects/{id}/remove_member/` | Remove a member |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/?project={id}` | List tasks for a project |
| POST | `/api/tasks/` | Create a task |
| PATCH | `/api/tasks/{id}/` | Update task fields |
| DELETE | `/api/tasks/{id}/` | Delete task (admin only) |
| PATCH | `/api/tasks/{id}/add-comment/` | Append a comment |

**Task filter params:** `?status=todo`, `?priority=high`, `?assigned_to={id}`, `?search=keyword`

### Notifications & Logs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications/` | List user's notifications |
| PATCH | `/api/notifications/{id}/` | Mark as read |
| GET | `/api/activity-logs/?project_id={id}` | Project activity history |

---

## Multi-User Test Flow

This is the fastest way to verify the full collaborative experience:

1. **Register as User A** → Create a project called "TaskFlow Demo"
2. **Open Project Settings** → Invite User B by their username or email, role: Member
3. **Create a task** → Set priority to High, assign to User B
4. **Open an incognito window** → Register/login as User B
5. **Open the same project** → Drag the assigned task from "To Do" to "Done"
6. **Switch back to User A's tab** → The task moves in real time (WebSocket)
7. **Check the Activity Log** → See User B's action with exact timestamp
8. **Check the Notification Bell** (User B) → Assignment notification is there

---

## Project Structure

```
taskflow/
├── taskflow_backend/
│   ├── users/              # Custom user model, registration, permissions
│   ├── projects/           # Project + ProjectMember models, invite logic
│   ├── tasks/              # Task model, Kanban API, comments
│   ├── notifications/      # Notification model and viewset
│   ├── logs/               # ActivityLog model and viewset
│   ├── taskflow_backend/   # Settings, URLs, ASGI (Channels config)
│   └── requirements.txt
│
└── taskflow_frontend/
    └── src/
        ├── components/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── ProjectBoard.jsx    # Kanban board with @dnd-kit
        │   ├── TaskBoard.jsx
        │   ├── TaskDetailModal.jsx # Edit / comment modal
        │   ├── ProjectSettings.jsx # Invite + member management
        │   └── NotificationBell.jsx
        ├── services/
        │   └── api.js              # Axios instance with JWT interceptor
        └── App.jsx
```

---

## Roadmap

| Status | Feature |
|---|---|
| ✅ Done | JWT auth with registration and login |
| ✅ Done | Role-based access (Admin / Member) per project |
| ✅ Done | Kanban drag-and-drop (@dnd-kit) |
| ✅ Done | Task comments with author + timestamp |
| ✅ Done | Real-time updates via Django Channels (WebSockets) |
| ✅ Done | Activity log per project |
| ✅ Done | In-app notifications + email alerts |
| ✅ Done | Search and multi-filter tasks |
| ✅ Done | Project member management (invite, role change, remove) |
| ⏳ Planned | OAuth login (Google / GitHub) |
| ⏳ Planned | File attachments on tasks |
| ⏳ Planned | Task due-date calendar view |
| ⏳ Planned | Unit and integration test suite |
| ⏳ Planned | Swagger / OpenAPI documentation |

---

## Author

Built as a full-stack portfolio project demonstrating Django REST Framework, React 18, real-time WebSockets, JWT authentication, and role-based access control.
