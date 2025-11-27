# SDLC Requirement Traceability Platform

A scalable, compliance-ready platform for end-to-end traceability of requirements across all SDLC phases. The system links requirements to user stories, tasks, test cases, code commits, and deployments, providing robust access control and audit logging for regulatory and organizational compliance.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Setup & Deployment](#setup--deployment)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Security & Compliance](#security--compliance)
- [Audit Logging & Export](#audit-logging--export)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Unique Requirement Identification**: Every requirement is assigned a UUID.
- **Artifact Linking**: Link requirements to user stories, tasks, test cases, code commits, and deployment records.
- **Traceability Matrix**: Real-time, up-to-date matrix and reporting views for all stakeholders.
- **Automated Integration**: Syncs with Jira, GitHub, Jenkins, and other SDLC tools.
- **Test & Deployment Status**: Flags failed tests and deployment rollbacks in traceability views.
- **Role-Based Access Control (RBAC)**: Secure, granular access to traceability data.
- **Comprehensive Audit Logging**: All access and modifications are logged, tamper-proof, and exportable.
- **Compliance Ready**: Designed for GDPR, SOC2, and other regulatory standards.

---

## Architecture Overview

- **Backend**: Node.js (Express) + TypeScript, RESTful API, TypeORM for PostgreSQL.
- **Frontend**: React (TypeScript), stakeholder-focused UI.
- **Database**: PostgreSQL, relational traceability.
- **Integrations**: Jira/Asana (project management), GitHub/GitLab (code), Jenkins/CircleCI (deployments).
- **Security**: Passport.js for authentication & RBAC, encrypted secrets, secure session management.
- **Logging**: Winston for structured, persistent, and exportable audit logs.
- **Containerization**: Docker Compose for orchestrated deployment.

---

## Tech Stack

- **Backend**: Node.js (Express), TypeScript, TypeORM
- **Frontend**: React, TypeScript
- **Database**: PostgreSQL
- **Authentication**: Passport.js (RBAC)
- **Integrations**: Jira, GitHub, Jenkins (API-based)
- **Testing**: Jest
- **Logging**: Winston
- **Documentation**: Swagger (OpenAPI)
- **Deployment**: Docker, Docker Compose

---

## Setup & Deployment

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- (Optional) Node.js & npm for local development

### Quick Start (Recommended)

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-org/sdlc-traceability-platform.git
   cd sdlc-traceability-platform
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories.
   - Fill in secrets and integration tokens as needed.

3. **Start all services:**
   ```sh
   docker-compose -f deployment/docker-compose.yml up --build
   ```

4. **Access the platform:**
   - Backend API: [http://localhost:4000/api](http://localhost:4000/api)
   - Frontend UI: [http://localhost:3000](http://localhost:3000)
   - Swagger Docs: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

### Local Development

- **Backend**: See `backend/README.md` for npm scripts and local dev instructions.
- **Frontend**: See `frontend/README.md` for npm scripts and local dev instructions.

---

## Environment Variables

The platform requires several environment variables for secure operation and integrations. See `.env.example` in each service directory for details.

**Backend (`backend/.env`):**
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `SESSION_SECRET`
- `JIRA_API_URL`, `JIRA_API_TOKEN`, `JIRA_BASE_URL`
- `GITHUB_API_URL`, `GITHUB_API_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`
- `JENKINS_API_URL`, `JENKINS_API_TOKEN`, `JENKINS_BASE_URL`, `JENKINS_JOB_NAME`

**Frontend (`frontend/.env`):**
- `REACT_APP_API_URL`

---

## API Documentation

- **Swagger/OpenAPI**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- See `backend/docs/swagger.yaml` for the full specification.

---

## Security & Compliance

- **RBAC**: All API and UI access is protected by role-based access control.
- **Audit Logging**: Every access and modification is logged with user, timestamp, action, and details.
- **Tamper-Proof Logs**: Audit logs are stored in a tamper-resistant manner and can be exported for compliance reviews.
- **Data Protection**: Sensitive data is encrypted and handled per GDPR/SOC2 requirements.
- **Alerts**: Unauthorized access attempts are logged and can trigger alerts.

---

## Audit Logging & Export

- All access and modifications to traceability data are logged.
- Audit logs can be exported in JSON or CSV format for compliance reviews.
- See the `/api/auditlog/export` endpoint in the API.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the coding guidelines and ensure all tests pass.
3. Submit a pull request with a clear description of your changes.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**For questions or support, contact:**  
SDLC Traceability Team  
support@sdlc-traceability.example.com