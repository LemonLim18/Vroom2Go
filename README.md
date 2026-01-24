# ☁️ AWS Master Deployment Guide for Vroom2 Go

This document is your definitive reference for deploying the Vroom2 Go platform to AWS using Docker. It covers the entire lifecycle: initial setup, building, deploying, and updating.

---

## 🏗️ 1. Architecture Overview
We use a **Multi-Container** approach split across instances or services:
*   **Frontend**: React (Vite) + Nginx. Uses `BACKEND_URL` baked in at build time.
*   **Backend**: Node.js + Express + Prisma. Connects DIRECTLY to AWS RDS.
*   **Database**: AWS RDS (MySQL) - Managed Service.

---

## 🛠️ 2. Prerequisites & Setup

### A. AWS Security Groups (Firewall)
Before launching instances, create two Security Groups in AWS EC2 Console.

**1. Backend Security Group (`vroom-backend-sg`)**
*   **Inbound Rules:**
    *   `SSH (22)` -> My IP (for your access)
    *   `Custom TCP (5000)` -> Anywhere `0.0.0.0/0` (API Access)
    *   `MYSQL (3306)` -> From **Backend Instance Private IP** (if using RDS) or `0.0.0.0/0` (if testing)

**2. Frontend Security Group (`vroom-frontend-sg`)**
*   **Inbound Rules:**
    *   `SSH (22)` -> My IP
    *   `HTTP (80)` -> Anywhere `0.0.0.0/0` (Web Access)
    *   `HTTPS (443)` -> Anywhere `0.0.0.0/0` (Future SSL)

---

### B. Instance Setup (EC2)
Launch two **Ubuntu 24.04** instances (one for Backend, one for Frontend) using the Security Groups above.

**On BOTH instances, install Docker (Official Method):**

**1. Set up Docker's apt repository:**
```bash
# Add Docker's official GPG key:
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
```

**2. Install Docker packages:**
```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable non-root user execution (Optional but recommended)
sudo usermod -aG docker $USER
# NOTE: Log out and back in for this to take effect!
```

---

## 🔁 3. Local Workflow (Your PC)

The code lives on your machine. You **Build** and **Push** images to Docker Hub. AWS sets simply **Pull** and **Run**.

### Step 1: Backend
The backend is environment-agnostic. Build it once.
```bash
cd backend
docker-compose build
docker push miinning/vroom2go_backend:latest
```

### Step 2: Frontend (Crucial!)
The frontend needs to know the **Public IP** of your Backend AWS instance.
1.  Get Backend AWS IP (e.g., `54.22.33.44`).
2.  Update `frontend/.env` locally (refer to `frontend/.env.sample`):
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key
    BACKEND_URL=http://54.22.33.44:5000
    ```
3.  **Build & Push**:
    ```bash
    cd frontend
    docker-compose build --no-cache  # Force rebuild to bake in the new IP
    docker push miinning/vroom2go_frontend:latest
    ```

---

## 🚀 4. Deployment Checklists

### Backend Instance (`vroom-backend`)
**Files Required on Server:**
*   `docker-compose.yml` (Renamed from `backend/docker-compose.prod.yml`)
*   `.env` (Created manually security)

**Deployment Steps:**
1.  **Create/Edit .env**:
    ```bash
    nano .env
    ```
    ```env
    # Server
    PORT=5000
    NODE_ENV=production

    # Database (Update with your RDS details)
    DATABASE_URL="mysql://admin:password@rds-endpoint.aws.com:3306/vroom2go"

    # JWT Authentication
    JWT_SECRET=your-super-secure-production-secret
    JWT_EXPIRES_IN=7d
    JWT_REFRESH_SECRET=your-refresh-secret-production
    JWT_REFRESH_EXPIRES_IN=30d

    # Stripe (Payments)
    STRIPE_SECRET_KEY=sk_live_...
    STRIPE_WEBHOOK_SECRET=whsec_...

    # Files
    UPLOAD_DIR=./uploads
    MAX_FILE_SIZE=5242880

    # Frontend URL (For CORS - Use your Domain or IP)
    FRONTEND_URL=http://YOUR_FRONTEND_IP_OR_DOMAIN

    # External APIs
    GOOGLE_MAPS_API_KEY=your_google_maps_key
    GEMINI_API_KEY=your_gemini_key
    ```
2.  **Pull & Run**:
    ```bash
    docker-compose pull
    docker-compose up -d
    ```
3.  **Initialize DB (First Time Only)**:
    ```bash
    docker exec backend-backend-1 npx prisma migrate deploy
    docker exec backend-backend-1 npx prisma db seed
    ```

### Frontend Instance (`vroom-frontend`)
**Files Required on Server:**
*   `docker-compose.yml` (Renamed from `frontend/docker-compose.prod.yml`)

**Deployment Steps:**
1.  **Pull & Run**:
    ```bash
    docker-compose pull
    docker-compose up -d
    ```

---

## 🔄 5. How to Update
When you change code (e.g., fix a bug):

**1. On Local Machine:**
*   Make code changes.
*   **Rebuild**:
    *   Backend change? `cd backend && docker-compose build && docker push ...`
    *   Frontend change? `cd frontend && docker-compose build && docker push ...`

**2. On AWS Instance:**
*   SSH into the instance.
*   Run:
    ```bash
    docker-compose pull
    docker-compose up -d --force-recreate
    ```
*   Your changes are live!

---

## ❓ Troubleshooting

**Q: Frontend shows "Network Error" or Login Fails?**
*   **Check API URL**: Open Frontend in browser, inspect Network tab. Is it trying to hit `localhost` or the AWS IP? If `localhost`, you forgot to update `frontend/.env` before building.
*   **Check Security Group**: Is Port 5000 open on the Backend instance? Can you visit `http://BACKEND_IP:5000/api/health`?

**Q: Database Connection Error?**
*   **Check .env**: verify `DATABASE_URL` inside the backend container (`docker exec -it backend-backend-1 env`).
*   **Check RDS SG**: Does RDS Security Group allow inbound from the Backend EC2 IP?

**Q: Deploying changes but not seeing them?**
*   Did you `docker push`?
*   Did you `docker-compose pull` on AWS?
*   Browser Cache: Try Hard Refresh (`Ctrl+F5`).
