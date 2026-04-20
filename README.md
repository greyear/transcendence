# Recipe Sharing Platform

A modern web application for sharing, discovering, and managing recipes with social features. Users can create and share their favorite recipes, follow other cooking enthusiasts, save favorites, leave comments, and explore a rich collection of culinary content.

## Quick Start (Makefile)

### 1) Prerequisites

Install the following tools:

- Docker Engine
- Docker Compose (`docker-compose` command)
- GNU Make (`make`)
- Node.js 20+ and npm (only for local service development without Docker)

Check that tools are available:

```bash
docker --version
docker-compose --version
make --version
node --version
npm --version
```

### 1.2) Environment files (`.env`)

This repository contains `.env.template` files. Copy them to `.env` before local development:

```bash
cp .env.template .env
```

Then replace placeholder values (for example, `JWT_SECRET="change-me"`).

### 1.3) Node.js version for local dev

Local commands `make dev-api`, `make dev-core`, and `npm test` require **Node.js >= 18** (recommended **Node.js 20 LTS**).

If your version is older (for example Node 12), install Node 20 with `nvm`:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20
node --version
```

## 2) Running the Application

### 2.1) Start all backend services via Docker (recommended)

From the project root:

```bash
sudo make up
```

This starts databases and backend microservices via Docker Compose.

Useful commands:

- `sudo make down` — stop all services
- `sudo make restart` — restart services
- `sudo make logs` — follow logs
- `sudo make db-status` — container and health status
- `sudo make db-reset` — reset only DB containers/volumes
- `sudo make clean` — full reset (including volumes)

### 2.2) Run services locally (dev mode, without running app containers)

If you want hot-reload development locally:

1. Start infrastructure first (DBs) with Docker:

```bash
sudo make up
```

2. In separate terminals run the services you need:

```bash
make dev-api
make dev-core
```

> Note: in this repository `auth-service` and `notification-service` are Docker stubs and are started with `make up`.

3. If dependencies are missing, install once per service:

```bash
cd backend/services/<service-name>
npm install
```

### 2.3) Main service endpoints

- API Gateway: `https://localhost:8443`
- Auth Service: `http://localhost:3001`
- Core Service: `http://localhost:3002`
- Notification Service: `http://localhost:3003`

## 3) Testing

The project uses **Jest** and **Supertest** for developer-friendly integration testing.

### Test Architecture
- **Integration Tests**: We test entire service routes without a browser.
- **Supertest**: Allows testing Express apps in-memory (no need to manage ports or wait for servers to start).
- **Mocks**: In the API Gateway, we mock downstream services using `jest.spyOn(global, 'fetch')` to ensure tests are fast and isolated.
- **Database**: `core-service` tests run against the real PostgreSQL database (specified in `.env`).

### How to Run Tests

From the project root:

```bash
# Run all tests for all services
make test-jest-all

# Run tests for a specific service using the root Makefile
make test-jest-core
make test-jest-api

# Alternative: run directly in service directory via npm
cd backend/services/core-service && npm test
cd backend/services/api-gateway && npm test

# Run tests in "watch" mode (re-runs on file changes)
cd backend/services/core-service && npm run test:watch
```

## Overview

This project is a full-stack Recipe Sharing Platform built with a microservices architecture. It demonstrates industry best practices in modern web development, including containerization, orchestration, and scalable service design.

### Key Features

- **Recipe Management**: Create, update, delete, and browse recipes with detailed ingredients, categories, and dietary information
- **Social Interactions**: Follow users, comment on recipes, and build a community around shared culinary interests
- **User Profiles**: Manage public profiles with avatars and track your recipe collection
- **Advanced Search**: Filter and discover recipes based on ingredients, categories, dietary preferences, and more
- **Notifications**: Stay updated on new followers, comments, and interactions
- **Secure Authentication**: OAuth 2.0 integration (Google) and two-factor authentication support

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

This project fulfills the following technical requirements:

- **Web Application**: Complete frontend and backend with persistent data storage
- **Version Control**: Git-based workflow with clear, meaningful commit messages and proper team collaboration
- **Containerization**: Fully containerized deployment using Docker, orchestrated with Kubernetes
- **Single-Command Deployment**: The entire application stack can be deployed with one command
- **Browser Compatibility**: Optimized for the latest stable version of Google Chrome
- **Production Quality**: No warnings or errors in the browser console
- **Legal Compliance**: Includes accessible Privacy Policy and Terms of Service pages

## Architecture Overview

The application follows a microservices architecture with clear separation of concerns:

- **API Gateway**: Single entry point for all client requests
- **Auth Service**: Handles authentication, authorization, and user identity
- **Core Service**: Manages recipes, profiles, and social interactions
- **Notification Service**: Handles event-driven notifications
- **Frontend**: User interface served as a containerized service

Each service is independently deployable, scalable, and maintains its own database, following the database-per-service pattern.

---

## DATABASE CHOICE:
This project uses multiple databases, each selected according to the purpose of each microservice and how it accesses data.

Each microservice owns its database and is the single source of truth for its data.

* The authentication service manages identity and credentials using MongoDB.
* The core service manages business data using PostgreSQL.
* The notification service manages delivery state and event tracking using PostgreSQL.

This separation:
* maintains loose coupling between services by isolating their data and responsibilities
* simplifies scaling and maintenance
* aligns with microservice best practices
* avoids cross-service database access

**PostgreSQL**
PostgreSQL is used for the core and notification services, where the system relies heavily on
* strong relationships between entities
* referential integrity (consistency of references across related entities)
* transactional consistency (related changes are either fully completed or rolled back)
* complex queries and filtering
* many-to-many relationships

Core domain features such as users’ public profiles, recipes, ingredients, categories, followers, favorites, and comments require reliable data consistency and explicit relationships between entities, which relational databases provide out of the box.

PostgreSQL was selected due to:
* ACID-compliant transactions (atomicity, consistency, isolation, durability)
* rich support for relational modeling
* advanced indexing capabilities
* support for complex joins and constraints
* suitability for scalable microservice architectures with strict data ownership

These characteristics are essential for maintaining data correctness under concurrent operations and high read/write load.

Additionally, PostgreSQL is widely used in modern development, making it a practical choice for gaining relevant industry experience.

**MongoDB**
MongoDB is used exclusively by the authentication service.

Authentication data has fundamentally different characteristics compared to the core domain:
* flexible and evolving schema (allows schema changes without costly migrations)
* no complex joins
* high read/write frequency
* isolated data ownership

MongoDB is a good fit for this use case because it:
* allows flexible document-based modeling
* simplifies storage of authentication-related data
* avoids unnecessary relational overhead
* remains isolated from core domain data

Using MongoDB for authentication ensures that sensitive credential data is fully decoupled from the core relational database, improving security and scalability.

## MICROSERVICES:
The system is divided into microservices based on clearly defined business responsibilities: authentication, core domain logic, and notifications.
Each service owns its data and encapsulates a single responsibility, while the API Gateway serves as a unified entry point responsible for request routing, security, and cross-cutting concerns.

Business logic is implemented within individual services, while cross-cutting concerns are handled at the gateway level.

### API Gateway

Responsibility:
* Acts as a single entry point for all client requests.

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
* Favorites and user–recipe interactions
* Followers system (mutual follows treated as friends)
* Comments on recipes
* Advanced filtering and search across recipes
* Domain-specific business rules and validations

Database: core_db (PostgreSQL)

### Notification Service

Responsibility:
Handles user notifications and delivery tracking for domain events.

Contains:
* Notification creation based on domain events (new follower, new comment, etc.)
* Notification delivery status tracking
* User notification preferences (optional)
* Marking notifications as read/unread
* Retry logic for failed deliveries (optional)
* Integration points for external delivery channels (optional)

Database: notification_db (PostgreSQL)

## KUBERNETES:
Kubernetes (K8s) is an open-source container orchestration platform designed to manage, scale, and maintain containerized applications.

While Docker Compose is suitable for local development and simple setups, it lacks the orchestration, scalability, and fault-tolerance required for a microservices-based architecture. Kubernetes provides these capabilities by managing service lifecycle, networking, scaling, and resilience.

For this reason, the project is deployed using Kubernetes with Minikube.

Kubernetes is responsible for orchestrating all components of the system, including:
* frontend application
* backend microservices
* databases

This approach ensures a deployment model that closely resembles production-grade environments.

Kubernetes continuously monitors the state of the system and is able to:
* automatically restart failed containers
* terminate containers that do not pass defined health checks
* replace unhealthy instances to maintain the desired system state

Minikube is a local Kubernetes distribution that runs a single-node cluster, where both control plane and worker components operate on the same node. It is well-suited for development and educational purposes while preserving real Kubernetes behavior.

kubectl is the command-line tool used to interact with and manage Kubernetes clusters, allowing users to deploy resources, inspect cluster state, and control workloads.


