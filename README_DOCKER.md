# Docker Deployment Guide for Vroom2 Go

This guide explains how to run the application using Docker and how to seed the database.

## 1. Prerequisites
Ensure you have Docker and Docker Compose installed.

## 2. Shared Network (Run Once)
The frontend and backend need to talk to each other. Create a shared network:
```bash
docker network create vroom2go-net
```

## 3. Run Backend (Start First)
Open a terminal in the `Vroom2 Go` folder:
```bash
cd backend
docker-compose up --build -d
```
*   **API URL**: `http://localhost:5000`
*   **Database (GUI Access)**: `localhost:3307`

## 4. Database Setup (Crucial!)
Since the Docker database starts empty, you must create the tables and add data.
Run these commands in your terminal:

**Step 1: Create Tables**
```bash
docker exec backend-backend-1 npx prisma migrate deploy
```

**Step 2: Seed Data**
```bash
docker exec backend-backend-1 npx prisma db seed
```
*(This command runs the `seed.ts` script inside the container to create default users and services)*

## 5. Run Frontend
Open a **new terminal** in the `Vroom2 Go` folder:
```bash
cd frontend
docker-compose up --build -d
```
*   **App URL**: `http://localhost` (Port 80)

## 6. Verification
1.  Visit `http://localhost` in your browser.
2.  Try logging in with the default user (created by the seed):
    *   **Email**: `limmiinning@gmail.com`
    *   **Password**: `password123`

## 7. Stopping Everything
To stop the containers:
```bash
cd backend
docker-compose down


## 8. Deploying to AWS (Multi-Server)
**Important:** `vroom2go-net` ONLY works if both containers are on the **SAME** machine.

If you put Frontend on AWS Backend on AWS Machine B:

1.  **Backend Machine (Machine B)**:
    *   Run the backend as normal.
    *   Find its **Public IP** (e.g., `54.123.45.67`).
    *   Ensure **Port 5000** is open in the AWS Security Group.

2.  **Frontend Machine (Machine A)**:
    *   Create a `.env` file in the `frontend/` folder.
    *   Add this line: `BACKEND_URL=http://54.123.45.67:5000` (Use your backend's Public IP).
    *   Run `docker-compose up --build -d`.


This bakes the Public IP into the Frontend code so your users' browsers can find the Backend.
