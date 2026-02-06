# PRD: Multi-Tenant Prompt Library Application

## Overview

A self-hosted, multi-tenant prompt library application for managing, organizing, and searching AI prompts. The application provides secure Google OAuth authentication, per-user data isolation via PostgreSQL Row-Level Security, and a modern React-based UI with a split-pane Markdown editor. Optimized for local development with Docker Compose, featuring hot-reload for both frontend and backend services.

## Goals

- Provide a secure, isolated prompt storage solution for multiple users
- Enable efficient prompt organization through tags, categories, and full-text search
- Deliver a seamless local development experience with single-command startup
- Implement production-ready authentication with Google OAuth 2.0
- Create an intuitive UI for creating, editing, and finding prompts quickly

## Quality Gates

These commands must pass for every user story:
- `docker-compose build` - All containers must build successfully
- `docker-compose up` with health checks passing for all services
- All services must respond to their health check endpoints

## User Stories

### US-001: Project scaffolding and Docker Compose setup
As a developer, I want to clone the repo and run `docker-compose up` so that all services start correctly with health checks passing.

**Acceptance Criteria:**
- [ ] Create project directory structure: `/backend`, `/frontend`, `/nginx`, `/docker`
- [ ] Create `docker-compose.yml` with services: `db`, `backend`, `frontend`, `nginx`
- [ ] PostgreSQL service with health check (pg_isready)
- [ ] Backend service depends on healthy db, has health check endpoint `/health`
- [ ] Frontend service with health check
- [ ] Nginx service depends on backend and frontend, has health check
- [ ] Create `.env.example` with all required environment variables documented
- [ ] Create `README.md` with setup instructions placeholder

### US-002: PostgreSQL database schema and migrations
As a developer, I want the database schema created automatically on startup so that the application has all required tables.

**Acceptance Criteria:**
- [ ] Create Alembic migration setup in backend
- [ ] Create `users` table: id (UUID), google_id (unique), email, name, picture_url, created_at, updated_at
- [ ] Create `prompts` table: id (UUID), user_id (FK), title, content (TEXT), category, tags (TEXT[]), created_at, updated_at
- [ ] Enable Row-Level Security on `prompts` table
- [ ] Create RLS policy: users can only SELECT/INSERT/UPDATE/DELETE their own prompts
- [ ] Create GIN index on prompts for full-text search (title, tags, content with weights)
- [ ] Migrations run automatically on backend startup
- [ ] Create index on prompts.user_id for query performance

### US-003: FastAPI backend foundation with health checks
As a developer, I want a FastAPI backend with proper structure so that I can build API endpoints on a solid foundation.

**Acceptance Criteria:**
- [ ] Create FastAPI application in `/backend/app/main.py`
- [ ] Implement `/health` endpoint returning `{"status": "healthy", "database": "connected"}`
- [ ] Configure SQLAlchemy async with PostgreSQL
- [ ] Set up Pydantic settings for environment variables
- [ ] Configure CORS for frontend origin
- [ ] Create Dockerfile with hot-reload (uvicorn --reload)
- [ ] Create `requirements.txt` with all dependencies

### US-004: Google OAuth 2.0 authentication flow
As a user, I want to log in with my Google account so that I can securely access my prompts.

**Acceptance Criteria:**
- [ ] Create `/auth/google/login` endpoint that redirects to Google OAuth consent screen
- [ ] Create `/auth/google/callback` endpoint that handles OAuth callback
- [ ] Exchange authorization code for tokens with Google
- [ ] Fetch user profile (id, email, name, picture) from Google API
- [ ] Create or update user record in database
- [ ] Generate JWT token with user_id claim
- [ ] Set JWT in httpOnly, secure (in production), sameSite cookie
- [ ] Document Google Cloud Console setup steps in `.env.example`

### US-005: Authentication middleware and session management
As a developer, I want authentication middleware so that API endpoints are protected and user context is available.

**Acceptance Criteria:**
- [ ] Create JWT validation middleware
- [ ] Extract user_id from valid JWT and add to request state
- [ ] Create `/auth/me` endpoint returning current user profile
- [ ] Create `/auth/logout` endpoint that clears the auth cookie
- [ ] Return 401 for requests without valid JWT to protected endpoints
- [ ] Set PostgreSQL session variable for RLS (`SET app.current_user_id`)

### US-006: Prompts CRUD API endpoints
As a user, I want API endpoints to manage my prompts so that I can create, read, update, and delete them.

**Acceptance Criteria:**
- [ ] `POST /api/prompts` - Create prompt (title, content, category, tags)
- [ ] `GET /api/prompts` - List user's prompts with pagination (limit, offset)
- [ ] `GET /api/prompts/{id}` - Get single prompt by ID
- [ ] `PUT /api/prompts/{id}` - Update prompt
- [ ] `DELETE /api/prompts/{id}` - Delete prompt (returns 204)
- [ ] All endpoints respect RLS (users only see their own prompts)
- [ ] Validate request bodies with Pydantic schemas
- [ ] Return proper HTTP status codes (201, 200, 204, 404, 422)

### US-007: Full-text search and filtering API
As a user, I want to search and filter my prompts so that I can quickly find what I need.

**Acceptance Criteria:**
- [ ] Add `search` query parameter to `GET /api/prompts` for full-text search
- [ ] Search weighted: title (A) > tags (B) > content (C)
- [ ] Add `category` query parameter for exact category filter
- [ ] Add `tags` query parameter (comma-separated) for tag filtering
- [ ] Combine filters with AND logic
- [ ] Return results sorted by relevance when searching, by updated_at otherwise
- [ ] Include total count in response for pagination

### US-008: User tags autocomplete endpoint
As a user, I want tag suggestions from my existing tags so that I can maintain consistent tagging.

**Acceptance Criteria:**
- [ ] Create `GET /api/tags` endpoint returning user's unique tags
- [ ] Add optional `q` query parameter for prefix filtering
- [ ] Return tags sorted by usage frequency (most used first)
- [ ] Limit results to 20 tags
- [ ] Response format: `{"tags": ["tag1", "tag2", ...]}`

### US-009: React frontend scaffolding with Vite
As a developer, I want a React frontend with proper tooling so that I can build the UI efficiently.

**Acceptance Criteria:**
- [ ] Initialize Vite + React + TypeScript project in `/frontend`
- [ ] Configure TailwindCSS with sensible defaults
- [ ] Set up React Router for client-side routing
- [ ] Create basic layout component with header and main content area
- [ ] Configure Vite proxy to backend API (for development)
- [ ] Create Dockerfile with hot-reload (vite dev with --host)
- [ ] Create API client utility with fetch wrapper (handles cookies, errors)

### US-010: Authentication UI and protected routes
As a user, I want to see a login page and be redirected appropriately so that I can access the application securely.

**Acceptance Criteria:**
- [ ] Create login page with "Sign in with Google" button
- [ ] Implement auth context/provider to manage user state
- [ ] Fetch `/auth/me` on app load to check authentication
- [ ] Redirect unauthenticated users to login page
- [ ] Redirect authenticated users from login to prompts list
- [ ] Display user name and profile picture in header when logged in
- [ ] Implement logout button that calls `/auth/logout` and redirects to login

### US-011: Prompts list view with table layout
As a user, I want to see my prompts in a table so that I can browse and manage them efficiently.

**Acceptance Criteria:**
- [ ] Create prompts list page at `/prompts` route
- [ ] Display prompts in table with columns: Title, Category, Tags, Updated
- [ ] Implement pagination controls (previous/next, showing "X of Y")
- [ ] Each row is clickable, navigates to prompt detail page
- [ ] Show loading state while fetching
- [ ] Show empty state with "Create your first prompt" CTA when no prompts
- [ ] Add "New Prompt" button in header/toolbar

### US-012: Search and filter UI
As a user, I want search and filter controls so that I can find prompts quickly.

**Acceptance Criteria:**
- [ ] Add search input field with debounced search (300ms)
- [ ] Add category filter dropdown (populated from user's categories)
- [ ] Add tags filter (multi-select from user's tags)
- [ ] Filters update URL query parameters for shareability
- [ ] Clear filters button when any filter is active
- [ ] Show "No results found" when search/filter returns empty

### US-013: Prompt detail page with split-pane Markdown editor
As a user, I want to view and edit a prompt with Markdown preview so that I can write formatted content easily.

**Acceptance Criteria:**
- [ ] Create prompt detail/edit page at `/prompts/:id` route
- [ ] Split-pane layout: editor on left, live Markdown preview on right
- [ ] Title input field at top
- [ ] Category input field (free-form text)
- [ ] Tags input with autocomplete from user's existing tags
- [ ] Save button that calls PUT endpoint
- [ ] Show save success/error feedback (toast notification)
- [ ] Back button/link to return to list
- [ ] Responsive: stack vertically on mobile

### US-014: Create new prompt page
As a user, I want to create a new prompt so that I can add to my library.

**Acceptance Criteria:**
- [ ] Create new prompt page at `/prompts/new` route
- [ ] Same layout as edit page (split-pane editor)
- [ ] All fields empty initially
- [ ] Save button calls POST endpoint
- [ ] On successful save, redirect to the new prompt's detail page
- [ ] Cancel button returns to list without saving

### US-015: Copy prompt functionality
As a user, I want to copy prompts to clipboard so that I can use them quickly in other applications.

**Acceptance Criteria:**
- [ ] Add copy button in prompt list (icon button in actions column)
- [ ] Add copy buttons in prompt detail page
- [ ] "Copy" button copies raw content
- [ ] "Copy as Markdown" button copies content with title as H1 header
- [ ] Show toast notification on successful copy
- [ ] Handle clipboard API errors gracefully

### US-016: Delete prompt with confirmation
As a user, I want to delete prompts with confirmation so that I don't accidentally lose data.

**Acceptance Criteria:**
- [ ] Add delete button in prompt detail page
- [ ] Show confirmation dialog: "Are you sure you want to delete [title]?"
- [ ] Dialog has Cancel and Delete buttons
- [ ] Delete button calls DELETE endpoint
- [ ] On success, redirect to prompts list with success toast
- [ ] On error, show error toast and keep dialog open

### US-017: Nginx reverse proxy configuration
As a developer, I want Nginx to route requests correctly so that the application works as a unified whole.

**Acceptance Criteria:**
- [ ] Create Nginx configuration in `/nginx/nginx.conf`
- [ ] Route `/api/*` and `/auth/*` to backend service
- [ ] Route all other requests to frontend service
- [ ] Configure WebSocket support for Vite HMR
- [ ] Set appropriate proxy headers (X-Real-IP, X-Forwarded-For, Host)
- [ ] Configure health check endpoint
- [ ] Expose on port 80 (mapped to host port in docker-compose)

### US-018: Documentation and setup guide
As a developer, I want complete documentation so that I can set up and run the project easily.

**Acceptance Criteria:**
- [ ] Complete README.md with: project description, features list, tech stack
- [ ] Prerequisites section (Docker, Google Cloud account)
- [ ] Step-by-step Google OAuth setup instructions with screenshots placeholders
- [ ] Environment variables documentation in `.env.example` with comments
- [ ] Quick start: `cp .env.example .env`, configure, `docker-compose up`
- [ ] Development workflow section (hot-reload, logs, rebuilding)
- [ ] Troubleshooting section with common issues

## Functional Requirements

- FR-1: The system must authenticate users exclusively via Google OAuth 2.0
- FR-2: The system must isolate user data using PostgreSQL Row-Level Security based on user_id
- FR-3: The system must store JWT tokens in httpOnly cookies, not localStorage
- FR-4: The system must provide full-text search with weighted ranking (title > tags > content)
- FR-5: The system must support pagination for prompt listing with configurable page size
- FR-6: The system must validate all API inputs using Pydantic schemas
- FR-7: The system must return appropriate HTTP status codes for all operations
- FR-8: The system must support hot-reload for both frontend and backend in development
- FR-9: The system must perform health checks on all services before marking them as ready
- FR-10: The system must automatically run database migrations on backend startup

## Non-Goals

- User registration without Google (email/password auth)
- Prompt sharing between users
- Team/organization multi-tenancy
- Prompt versioning or history
- Prompt favorites/pinning
- Custom themes or dark mode
- Export/import functionality
- API rate limiting
- Email notifications
- Mobile native apps

## Technical Considerations

- **Database**: Use PostgreSQL 15+ for best JSON and full-text search support
- **RLS Implementation**: Set `app.current_user_id` session variable on each request, create policies that reference `current_setting('app.current_user_id')`
- **Full-text Search**: Create `tsvector` column with trigger, use `ts_rank` for ordering
- **JWT**: Use PyJWT with RS256 or HS256, set reasonable expiration (e.g., 7 days)
- **Frontend State**: Consider React Query or SWR for server state management
- **Markdown**: Use `react-markdown` with `remark-gfm` for GitHub-flavored markdown
- **Tags Input**: Consider `react-select` or similar for autocomplete component
- **Docker Networking**: Use Docker Compose internal network, only expose Nginx port

## Success Metrics

- All services start successfully with `docker-compose up`
- All health checks pass within 60 seconds of startup
- User can complete full OAuth flow and see their profile
- User can create, edit, search, and delete prompts
- RLS correctly prevents cross-user data access
- Hot-reload works for both frontend and backend code changes
- Full-text search returns relevant results with sub-second response time

## Open Questions

- Should we add request logging/tracing for debugging in development?
- What should the JWT expiration time be? (Suggested: 7 days with refresh consideration for v2)
- Should we add Docker volume for PostgreSQL data persistence by default?