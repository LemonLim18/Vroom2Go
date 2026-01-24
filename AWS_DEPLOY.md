# Deployment Guide: Docker Hub + AWS

This guide explains how to build your images correctly on your local machine, push them to Docker Hub, and run them on your AWS instances.

## 1. Preparation (On Your Local Machine)

### Backend
The backend is easy. It reads environment variables at runtime.
1.  **Build & Push**:
    ```bash
    cd backend
    docker build -t miinning/vroom2go_backend:latest .
    docker push miinning/vroom2go_backend:latest
    ```

### Frontend (Crucial Step!)
The frontend **BAKES the API URL** into the code when you build it. You **MUST** build a specific version for AWS that points to your AWS Backend IP.

1.  **Set the IP**: Create or update your `frontend/.env` file:
    ```env
    BACKEND_URL=http://54.123.45.67:5000
    ```
2.  **Build Only**:
    ```bash
    cd frontend
    docker-compose build
    ```
3.  **Push**:
    ```bash
    docker push miinning/vroom2go_frontend:latest
    ```

---

## 2. Running on AWS (Using Docker Compose)

This is the easiest way. You just copy one file and run it.

### Backend Instance
1.  **Copy Files**: Copy `backend/docker-compose.prod.yml` AND `backend/.env` to your server.
2.  **Rename**: Rename the compose file to `docker-compose.yml`.
3.  **Edit .env**: Open the `.env` file on your server and update the values for production:
    *   `DATABASE_URL`: Set to your real AWS RDS endpoint.
    *   `FRONTEND_URL`: Set to your Frontend's Public IP.
    *   `JWT_SECRET`: Set to a new random secret.
4.  **Run**:
    ```bash
    docker-compose up -d
    ```

5.  **Initialize DB** (First time only):
    ```bash
    docker exec backend-backend-1 npx prisma migrate deploy
    docker exec backend-backend-1 npx prisma db seed
    ```

### Frontend Instance
1.  **Copy File**: Copy `frontend/docker-compose.prod.yml` to your server.
2.  **Rename**: Rename it to `docker-compose.yml`.
3.  **Run**:
    ```bash
    # Pulls the latest image and starts it
    docker-compose up -d
    ```

