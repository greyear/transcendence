# Recipe Sharing Platform

A full-stack recipe-sharing platform for discovering, creating, and managing recipes with social features. Users can follow other cooks, save favourites, leave comments, and browse a wide range of culinary content.

Below is the application README. For more details regarding the project and its progress, click [here](docs/README2.md).

## Team members and roles

Our team consists of 5 members:
	- Anya Zinchenko (Project Manager and Product Owner)
	- Nick Saveliev (Product Owner and Technical Lead)
	- Eric Lehtonen (Developer)
	- Jimi Karhu (Developer)
	- Seela Salorinta (Developer)

## Quick Start (Makefile)

### 1) Prerequisites

Install the following tools before working on the project:

- Docker Engine
- Docker Compose (`docker-compose` command)
- GNU Make (`make`)
- Node.js 20+ and npm (for local service development without Docker)

Check that tools are available:

```bash
docker --version
docker-compose --version
make --version
node --version
npm --version
```

### 1.2) Environment files (`.env`)

Each service has its own `.env.template` file. Copy the templates to `.env` before starting local development:

```bash
cp .env.template .env
cp backend/services/api-gateway/.env.template backend/services/api-gateway/.env
cp backend/services/core-service/.env.template backend/services/core-service/.env
cp backend/services/auth-service/.env.template backend/services/auth-service/.env
```

Then replace the placeholder values, for example `JWT_SECRET="change-me"`.

### 1.3) Node.js version for local dev

Local commands `make dev-api`, `make dev-core`, and `npm test` require **Node.js 18 or newer**. **Node.js 20 LTS** is recommended.

If your version is older, install Node 20 with `nvm`:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20
node --version
```

## 2) Running the Application

### 2.1) Start all backend services via Docker (recommended)

From the project root, run:

```bash
sudo make up
```

This starts the databases and backend services through Docker Compose.

Useful commands:

- `sudo make down` — stop all services
- `sudo make restart` — restart the stack
- `sudo make logs` — follow the logs
- `sudo make db-status` — view container and health status
- `sudo make db-reset` — reset only the database containers and volumes
- `sudo make clean` — full reset, including volumes

### 2.2) Run services locally (dev mode, without running app containers)

If you want hot-reload development locally:

1. Start the infrastructure first with Docker:

```bash
sudo make up
```

2. In separate terminals, run the services you need:

```bash
make dev-api
make dev-core
```

> Note: in this repository `auth-service` runs through Docker and are started with `make up`.

3. If dependencies are missing, install them once per service:

```bash
cd backend/services/<service-name>
npm install
```

### 2.3) Main service endpoints

- API Gateway: `http://localhost:3000`
- Auth Service: `http://localhost:3001`
- Core Service: `http://localhost:3002`

## 3) Testing

The project uses **Jest** and **Supertest** for integration testing.

### Test Architecture
- **Integration tests**: Entire service routes are tested without a browser.
- **Supertest**: Express apps are tested in memory, so there is no need to manage ports or wait for servers to start.
- **Mocks**: In the API Gateway, downstream services are mocked with `jest.spyOn(global, 'fetch')` so tests stay fast and isolated.
- **Database**: `core-service` tests run against the real PostgreSQL database configured in `.env`.

### How to Run Tests

From the project root:

```bash
# Run all tests for all services
make test-jest-all

# Run tests for a specific service using the root Makefile
make test-jest-core
make test-jest-api

# Alternative: run directly in the service directory via npm
cd backend/services/core-service && npm test
cd backend/services/api-gateway && npm test

# Run tests in "watch" mode (re-runs on file changes)
cd backend/services/core-service && npm run test:watch
```

## Overview

This project is a full-stack recipe-sharing platform built with a microservices architecture. The frontend uses React and React Router, while the backend is split into TypeScript and Express services with separate databases and container-based deployment.

### Key Features

- **Recipe management**: Create, update, delete, and browse recipes with ingredients, categories, and dietary information
- **Social interactions**: Follow users, comment on recipes, and build a community around shared culinary interests
- **User profiles**: Manage public profiles with avatars and track your recipe collection
- **Advanced search**: Filter and discover recipes based on ingredients, categories, dietary preferences, and more
- **Secure authentication**: OAuth 2.0 integration with Google and two-factor authentication support

## Code cleanup

Check the code linting and formatting:
```bash
npm run check
```
Fix lint and formatting issues:
```bash
npm run fix
```

## Project Requirements

This project is designed to meet the following technical requirements:

- **Web Application**: Complete frontend and backend with persistent data storage
- **Version Control**: Git-based workflow with clear, meaningful commit messages and team collaboration
- **Containerization**: Fully containerised deployment using Docker and docker-compose
- **Single-Command Deployment**: The entire application stack can be deployed with one command
- **Browser Compatibility**: Optimised for the latest stable version of Google Chrome
- **Production Quality**: No warnings or errors in the browser console
- **Legal Compliance**: Includes accessible Privacy Policy and Terms of Service pages

## Architecture Overview

The application follows a microservices architecture with clear separation of concerns:

- **API Gateway**: Single entry point for all client requests
- **Auth Service**: Handles authentication, authorisation, and user identity
- **Core Service**: Manages recipes, profiles, and social interactions
- **Frontend**: User interface served as a containerised service

Each service is independently deployable, scalable, and maintains its own database, following the database-per-service pattern.

---

## DATABASE CHOICE:
This project uses multiple databases, each chosen to suit the way the relevant service stores and queries data.

Each microservice owns its database and is the single source of truth for its data.

* The authentication service stores identity and credential data in MongoDB.
* The core service stores business data in PostgreSQL.

This separation:
* keeps the services loosely coupled by isolating their data and responsibilities
* simplifies scaling and maintenance
* aligns with microservice best practices
* avoids cross-service database access

**PostgreSQL**
PostgreSQL is used for the core service, where the system relies heavily on:
* strong relationships between entities
* referential integrity across related records
* transactional consistency
* complex queries and filtering
* many-to-many relationships

Core domain features such as public profiles, recipes, ingredients, categories, followers, favourites, and comments require reliable consistency and explicit relationships between entities, which relational databases provide naturally.

PostgreSQL was selected due to:
* ACID-compliant transactions
* rich support for relational modelling
* advanced indexing capabilities
* support for complex joins and constraints
* suitability for scalable microservice architectures with strict data ownership

These characteristics are important for maintaining data correctness under concurrent operations and higher read/write load.

PostgreSQL is also widely used in modern development, making it a practical and familiar choice.

**MongoDB**
MongoDB is used exclusively by the authentication service.

Authentication data has different characteristics from the core domain:
* flexible and evolving schema (allows schema changes without costly migrations)
* no complex joins
* high read/write frequency
* isolated data ownership

MongoDB is a good fit for this use case because it:
* allows flexible document-based modelling
* simplifies storage of authentication-related data
* avoids unnecessary relational overhead
* remains isolated from core domain data

Using MongoDB for authentication keeps sensitive credential data decoupled from the core relational database, which improves security and scalability.

## MICROSERVICES:
The system is divided into microservices based on clearly defined responsibilities: authentication, core domain logic, and request routing.
Each service owns its data and encapsulates a single responsibility, while the API Gateway acts as the unified entry point for client requests.

Business logic lives within the individual services, while cross-cutting concerns are handled at the gateway level.

### API Gateway

Responsibility:
* Acts as the single entry point for all client requests.

Contains:
* Request routing to internal services
* JWT validation and authentication middleware
* Rate limiting and API key validation
* Request/response logging
* Basic request validation
* Response aggregation (if needed)

Does NOT contain:
* Business logic
* Database access

### Auth Service

Responsibility:
* Manages authentication and user identity.

Contains:
* User registration and login
* Password hashing and verification
* JWT and refresh token generation
* OAuth 2.0 integration (Google)
* Two-factor authentication logic (auth app)
* Token revocation and session management

Database: auth_db (MongoDB)

### Core Service

Responsibility:
Manages the core business domain of the application, including user profiles, recipes, and social interactions.

Contains:
* User profile management (public profile data)
* Avatar metadata management
* Recipes CRUD operations
* Ingredients, categories, and dietary data management
* Favourites and user–recipe interactions
* Followers system (mutual follows treated as friends)
* Comments on recipes
* Advanced filtering and search across recipes
* Domain-specific business rules and validations

Database: core_db (PostgreSQL)
