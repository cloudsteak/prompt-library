# Prompt Library

A self-hosted, multi-tenant prompt library application for managing, organizing, and searching AI prompts. Built with Google OAuth authentication, full-text search, and a modern React frontend.

## Features

- **Google OAuth Authentication**: Secure login with Google accounts
- **Multi-tenant**: Each user has their own private prompt collection
- **Full-text Search**: Quickly find prompts by title or content
- **Markdown Support**: Write prompts with full markdown formatting
- **Tagging System**: Organize prompts with custom tags
- **Copy to Clipboard**: One-click copy for prompts (raw or as markdown)
- **Responsive Design**: Works on desktop and mobile devices
- **Docker-based**: Easy deployment with Docker Compose

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL 15** - Database with full-text search
- **SQLAlchemy** - Async ORM with asyncpg driver
- **Alembic** - Database migrations
- **PyJWT** - JWT token authentication

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool with HMR
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
  - [Install Docker Desktop](https://docs.docker.com/get-docker/) (includes Docker Compose)
- **A Google Cloud account** for OAuth credentials
  - Free tier is sufficient

## Google OAuth Setup

Follow these steps to configure Google OAuth for authentication:

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter a project name (e.g., "Prompt Library")
5. Click **"Create"**

<!-- Screenshot placeholder: Google Cloud Console - New Project dialog -->

### 2. Enable Required APIs

1. In your project, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**

<!-- Screenshot placeholder: API Library - Enable Google+ API -->

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Select **"External"** user type (or "Internal" if using Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: "Prompt Library" (or your preferred name)
   - **User support email**: Your email address
   - **Developer contact email**: Your email address
5. Click **"Save and Continue"**
6. On the Scopes page, click **"Add or Remove Scopes"**
7. Add these scopes:
   - `email`
   - `profile`
   - `openid`
8. Click **"Save and Continue"**
9. On the Test Users page, add your email if in testing mode
10. Click **"Save and Continue"**

<!-- Screenshot placeholder: OAuth consent screen configuration -->

### 4. Create OAuth Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Select **"Web application"** as the application type
4. Enter a name (e.g., "Prompt Library Web Client")
5. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost
   ```
6. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost/auth/google/callback
   ```
7. Click **"Create"**
8. **Copy the Client ID and Client Secret** - you'll need these in the next step

<!-- Screenshot placeholder: OAuth client ID creation -->

> **Note**: For production deployments, replace `http://localhost` with your actual domain (e.g., `https://prompts.example.com`).

## Quick Start

### 1. Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd prompt-inventory

# Copy the environment file
cp .env.example .env
```

### 2. Edit Environment Variables

Open `.env` and fill in your Google OAuth credentials:

```bash
# Required: Your Google OAuth credentials from the previous step
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Required for production: Generate a secure JWT secret
# Run: python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET=your-secure-random-string
```

See `.env.example` for all available configuration options with detailed comments.

### 3. Start the Application

```bash
docker-compose up
```

The first run will build the containers, which may take a few minutes.

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost
```

Click "Login with Google" to authenticate and start using the application.

## Environment Variables

All environment variables are documented in `.env.example`. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | `promptlib` |
| `POSTGRES_PASSWORD` | Database password | `promptlib` |
| `POSTGRES_DB` | Database name | `promptlib` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | *required* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | *required* |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `http://localhost/auth/google/callback` |
| `JWT_SECRET` | Secret for signing JWT tokens | *change in production* |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:80,http://localhost` |
| `HOST_PORT` | Port nginx listens on | `80` |
| `VITE_API_URL` | Frontend API base URL | `http://localhost:80` |

## Development Workflow

### Starting Services

```bash
# Start all services in foreground (see logs)
docker-compose up

# Start all services in background
docker-compose up -d

# Start specific service
docker-compose up backend
```

### Hot-Reload Development

All services support hot-reload:

- **Backend**: Python code changes in `/backend` are automatically reloaded by uvicorn
- **Frontend**: React/TypeScript changes in `/frontend` trigger Vite HMR instantly

No need to rebuild or restart containers during development.

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Rebuilding Containers

Rebuild when you change `Dockerfile`, `requirements.txt`, or `package.json`:

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and start
docker-compose up --build
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v
```

### Running Commands in Containers

```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# Run database migrations
docker-compose exec backend alembic upgrade head

# Run Python commands
docker-compose exec backend python -c "print('hello')"
```

## Project Structure

```
prompt-inventory/
├── backend/             # FastAPI backend service
│   ├── alembic/         # Database migrations
│   ├── app/             # Application code
│   │   ├── api/         # API routes
│   │   ├── core/        # Configuration, security
│   │   ├── db/          # Database setup
│   │   ├── models/      # SQLAlchemy models
│   │   └── schemas/     # Pydantic schemas
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── types/       # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── nginx/               # Nginx reverse proxy
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml   # Service orchestration
├── .env.example         # Environment template
└── README.md            # This file
```

## Troubleshooting

### Container fails to start

**Symptom**: `docker-compose up` fails or containers keep restarting.

**Solutions**:
1. Check logs: `docker-compose logs <service-name>`
2. Verify `.env` file exists and has valid values
3. Ensure ports are not in use: `lsof -i :80` or `lsof -i :5432`
4. Try rebuilding: `docker-compose build --no-cache`

### Database connection errors

**Symptom**: Backend shows "connection refused" to database.

**Solutions**:
1. Wait for database to be healthy: `docker-compose ps` should show `db` as healthy
2. Check database logs: `docker-compose logs db`
3. Reset the database: `docker-compose down -v && docker-compose up`

### Google OAuth errors

**Symptom**: "redirect_uri_mismatch" or "invalid_client" errors.

**Solutions**:
1. Verify `GOOGLE_REDIRECT_URI` in `.env` matches exactly what's configured in Google Cloud Console
2. Check that JavaScript origins include `http://localhost` (no trailing slash)
3. If using a different port, update both `.env` and Google Cloud Console
4. Wait a few minutes after creating credentials (propagation delay)

### Frontend not loading / blank page

**Symptom**: Browser shows blank page or network errors.

**Solutions**:
1. Check frontend logs: `docker-compose logs frontend`
2. Verify `VITE_API_URL` matches your setup
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check browser console for JavaScript errors

### Port 80 already in use

**Symptom**: `bind: address already in use` error.

**Solutions**:
1. Find what's using port 80: `sudo lsof -i :80`
2. Stop the conflicting service, or
3. Change the port in `.env`:
   ```bash
   HOST_PORT=8080
   VITE_API_URL=http://localhost:8080
   ```
   Update Google OAuth redirect URI accordingly.

### Changes not reflecting

**Symptom**: Code changes don't appear in the running application.

**Solutions**:
1. **Backend**: Ensure you saved the file; uvicorn auto-reloads
2. **Frontend**: Vite HMR should update instantly; try hard refresh
3. **Config changes**: Restart containers: `docker-compose restart`
4. **Dependency changes**: Rebuild: `docker-compose build <service>`

### Reset everything

If all else fails, reset to a clean state:

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Remove built images
docker-compose down --rmi local

# Rebuild and start fresh
docker-compose up --build
```

## License

MIT License - See LICENSE file for details.
