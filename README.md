# Sigil Deck
*Where every prompt is a power word.*

Sigil Deck is a professional, high-end prompt management library designed for architects, engineers, and AI practitioners within the **Cloud Mentor** ecosystem. It provides a secure, glassmorphic interface for archiving, organizing, and deploying complex AI "Sigils" (prompts) with enterprise-grade precision.

---

## 🌌 The Digital Alchemy Vision
Sigil Deck transforms prompt management into a high-tech obsidian experience. Built with a focus on **visual excellence**, **architectural spacing**, and **responsive precision**, it serves as the official vault for your generative AI potential.

- **Vault-Grade Security**: Integrated with Google OAuth 2.0 and Cloud Mentor security protocols.
- **Glassmorphic Aesthetic**: A premium "Digital Alchemy" UI featuring backdrop blurs, teal accents, and neural background patterns.
- **GDPR Compliant**: Built-in privacy controls, cookie consent management, and data sovereignty rules.
- **Ecosystem Integration**: Seamlessly connected to the Cloud Mentor support and documentation network.

---

## 🔥 Key Features

- **Google OAuth Authentication**: Secure, effortless login using your official Google identity.
- **Multi-tenant Vaults**: Private, encrypted prompt storage unique to each user.
- **Semantic Organization**: Full-text search and tagging system for instantaneous retrieval of complex Sigils.
- **Rich Text Architecture**: Write and refine prompts with full markdown and rich text support.
- **Touch-Optimized**: Precise 44px+ touch targets for seamless mobile and tablet workflows.
- **Theme Versatility**: Toggle between Light and Dark modes with specialized obsidian and glassmorphic optimizations.
- **GDPR Protocol**: Built-in "Privacy & Cookies" portal and zero-load cookie consent banner.

---

## 🛠 Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework.
- **PostgreSQL 15**: Robust relational database with full-text search capabilities.
- **SQLAlchemy (Async)**: Modern ORM with `asyncpg` for non-blocking database operations.
- **PyJWT**: Secure token-based authentication session management.

### Frontend
- **React 18**: Modern component architecture.
- **TypeScript**: Strict type safety for enterprise stability.
- **Vite**: Rapid build and HMR development server.
- **Tailwind CSS**: Utility-first styling with custom "Digital Alchemy" design tokens.
- **Lucide React**: Clean, semantic iconography.

### Infrastructure
- **Docker & Compose**: Full containerization for reproducible environments.
- **Nginx**: Enterprise-grade reverse proxy and SSL termination readiness.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Docker** and **Docker Compose** installed.
- **Google Cloud Console** access for OAuth credentials.

### 2. Configure Environment
Clone the repository and initialize your secure vault settings:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `GOOGLE_CLIENT_ID`: Your Google OAuth ID.
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Secret.
- `JWT_SECRET`: A secure, random string for token signing.
- `LOGO_ASSET`: Place your official `logo.png` in `frontend/src/assets/`.

### 3. Deploy the Vault
```bash
docker-compose up --build
```
Access the deck at `http://localhost`.

---

## 🛡 GDPR & Legal
Sigil Deck is a **Cloud Mentor** project. Data processing is managed according to the highest security standards.
- **Privacy Policy**: Accessible at `/privacy` within the application.
- **Data Sovereignty**: Your prompts (Sigils) remain your intellectual property and are private by default.
- **Cookie Policy**: Strictly necessary cookies for authentication and performance telemetry.

---

## 🛸 Development & Logs
Hot-reload is enabled for both backend and frontend. To monitor the neural pulse:
```bash
docker-compose logs -f backend   # Monitor the Python API
docker-compose logs -f frontend  # Monitor the React Client
```

---

## 📜 License
© 2026 **CLOUD MENTOR**. All Rights Reserved.  
Sigil Deck is part of the Cloud Mentor AI toolset.
