*This project has been created as part of the 42 curriculum by azinchen, msavelie, ssalorin, jkarhu, elehtone.*

# ft_transcendence

A recipe sharing platform with a clean interface, social features and AI integration.

---

# Description

## Project Overview

Our ft_transcendence project, **Recipe Creating Platform (RCP)**, is a full-stack web application designed to help users discover, create, and manage recipes with comprehensive social features. The product enables users to share their culinary creations, follow other cooking enthusiasts (cooks), save favourite recipes, leave comments, and explore a rich collection of user-generated culinary content.

## Key Features

- **Recipe Discovery & Browsing**: Browse and search recipes with filtering and sorting options
- **Social Features**: Follow other cooks, view their profiles, and see their recipe collections
- **User Profiles**: Customisable user profiles with avatar support and online status visibility
- **Recipe Management**: Create, edit, and publish recipes with multilingual support
- **Community Interaction**: Comment on recipes, rate dishes, and build a community around shared culinary interests
- **Favourites**: Save favourite recipes for quick access
- **Multi-language Support**: Support for English, Finnish, and Russian languages

---

# Instructions

## Prerequisites

Before starting the project, ensure the following tools are installed on your system:

| Tool | Minimum version |
|------|---------|
| Docker | 20.10 |
| Docker Compose | 1.29 |
| GNU Make | Any modern version |
| Node.js | 20 |
| npm | 10 |

Verify these conditions:

```bash
docker --version
docker-compose --version
make --version
node --version
npm --version
```

## Environment Configuration

Each service requires environment variable configuration. Copy the `env.template` files to `.env`:

```bash
# Root project level
cp .env.template .env

# Backend services
cp backend/services/api-gateway/.env.template backend/services/api-gateway/.env
cp backend/services/core-service/.env.template backend/services/core-service/.env
cp backend/services/auth-service/.env.template backend/services/auth-service/.env
```

Replace placeholder values (e.g., `JWT_SECRET="your-super-secret-jwt-key-min-32-chars"`) with appropriate configuration values for your environment.

## Running the Project

Start all services via Docker Compose:

```bash
sudo make up
```

`sudo` may not be required depending on your system.

This command:
- Generates certificates if needed
- Starts all database containers (MongoDB for auth, PostgreSQL for core)
- Launches all backend services (API Gateway, Auth Service, Core Service)
- Configures Traefik reverse proxy for HTTPS routing
- Exposes the application at `https://localhost:8443`

Useful management commands:

| Command | Description |
|---------|-------------|
| `sudo make down` | Stop all services |
| `sudo make restart` | Restart the entire stack |
| `sudo make logs` | Watch logs for all services |
| `sudo make db-status` | View container health status |
| `sudo make db-reset` | Reset database containers and volumes |
| `sudo make clean` | Full cleanup including all volumes |
| `sudo make re` | Full cleanup and restart |

## Accessing the Application

- **Frontend**: `https://localhost:8443` (or `https://localhost` if port forwarding is configured)
- **API Gateway**: `http://localhost:3000` (internal/development)
- **Auth Service**: `http://auth-service:3001` (internal Docker network)
- **Core Service**: `http://core-service:3002` (internal Docker network)
- **Traefik Dashboard**: `http://localhost:8080` (traffic and routing visualisation)

---

# Team members and roles

Teams are required to consist of at least 4 and at most 5 members. Ours consisted of 5 members at kick-off.

## Team members

Our team consists of 5 members:
- Anya Zinchenko (azinchen)
- Nick Saveliev (msavelie)
- Seela Salorinta (ssalorin)
- Jimi Karhu (jkarhu)
- Eric Lehtonen (elehtone)

## Mandatory Roles

- **Product Owner (PO)**: Owns product vision, priorities, backlog, and validation of completed work.
	- Anya and Nick shared this role at various stages during the project.
- **Project Manager (PM) / Scrum Master**: Coordinates planning, communication, deadlines, risks, and blockers.
	- Anya was our project manager.
- **Technical Lead / Architect**: Leads architecture and stack decisions, code quality, and critical reviews.
	- This role fell to our member Nick.
- **Developers (all members)**: Implement features, review code, test, and document contributions.
	- All 5 of us were developers to various degrees.

---

# Resources

## Documentation References

- [Express.js Documentation](https://expressjs.com/)
- [React 19 Documentation](https://react.dev/)
- [React Router v7 Documentation](https://react-router.dev/)
- [PostgreSQL Database Documentation](https://www.postgresql.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Traefik Reverse Proxy Documentation](https://doc.traefik.io/)
- [Docker & Docker Compose Documentation](https://docs.docker.com/)

## AI Usage in This Project

AI tools (such as GitHub Copilot and Claude Code) were used for the following reasons:

- Researching new concepts or tools quickly
- Writing documentation drafts and templates
- **Code Generation**: Assistance with boilerplate code generation for Express middleware, route handlers, and React components
- **Database Schema Design**: Suggestions for optimal PostgreSQL schema design and indexing strategies
- **API Design**: Guidance on RESTful API endpoint design and request/response structures
- **Testing**: Support in writing unit and integration tests for backend services
- **Error Handling**: Suggestions for robust error handling patterns and middleware chains
- **Type Safety**: Assistance with TypeScript type definitions and validation schemas using Zod

All AI-generated code has been reviewed, tested, and integrated thoughtfully into the codebase. The team takes full responsibility for all implementation decisions and code quality.

# Tech stack

## Frontend

- **Framework**: React 19 with React Router v7
- **Language**: TypeScript 5.9+
- **Build Tool**: Vite 7.1
- **Styling**: <unknown or lacking> (CSS framework or solution)
- **State Management**: React Context API / <unknown or lacking>
- **Internationalisation**: react-i18next with remix-i18next
- **Form Validation**: Zod 4.3
- **Component Library**: Iconoir React (icons)
- **HTTP Client**: <unknown or lacking>

**Rationale**: React Router v7 provides modern, performant routing with server-side rendering capabilities. Vite ensures fast development build cycles and optimised production bundles. TypeScript provides type safety across the frontend layer.

## Backend

- **API Gateway**: Express.js 4.18 with TypeScript
- **Service Architecture**: Microservices pattern with three independent services
- **Language**: TypeScript 5.9+
- **Authentication Service**: Node.js with Express
- **Core Service**: Node.js with Express
- **Form Validation**: Zod 4.3 for schema validation
- **Testing**: Jest 30.3 with Supertest

**Rationale**: Express provides a lightweight, flexible HTTP server foundation. Microservices architecture enables independent scaling and deployment of different concerns (authentication, recipes, notifications).

## Databases

- **Auth Database**: MongoDB 6 (stores user authentication credentials and sessions)
  - **Port**: 27017
  - **Credentials**: Configurable via environment variables
  
- **Core Database**: PostgreSQL 15 (stores recipes, users, followers, ratings, comments)
  - **Port**: 5433
  - **Name**: `core_db`
  
- **Notification Database**: PostgreSQL 15 (stores notifications and events)
  - **Port**: 5434
  - **Name**: `notification_db`

**Rationale**: PostgreSQL selected for relational data (recipes, users, followers) with ACID compliance. MongoDB selected for flexible authentication session storage. Separate databases enable independent scaling and failure isolation.

## Infrastructure & DevOps

- **Containerisation**: Docker & Docker Compose
- **Reverse Proxy & Load Balancing**: Traefik v3.0
- **SSL/TLS**: Self-signed certificates for HTTPS
- **Service Orchestration**: Docker Compose (development/staging); Kubernetes manifests available for production

**Rationale**: Docker ensures consistency across development and production environments. Traefik provides automatic HTTPS routing and service discovery within the containerised environment.

# Database Schema

## Core Database (PostgreSQL)

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(32) UNIQUE NOT NULL,
  avatar VARCHAR(2048),
  status VARCHAR(16) DEFAULT 'offline',
  role VARCHAR(16) NOT NULL DEFAULT 'user',
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Stores user profile data and visibility status
**Key Fields**: User ID (from auth service), username, avatar URL, online status, role

### Followers Table

```sql
CREATE TABLE followers (
  user_id INTEGER NOT NULL,
  followed_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, followed_id)
);
```

**Purpose**: Manages user-to-user follow relationships
**Key Fields**: Unidirectional follower relationships with composite key

### Recipes Table

```sql
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  title JSONB NOT NULL,
  description JSONB,
  instructions JSONB NOT NULL,
  servings INTEGER DEFAULT 1,
  spiciness SMALLINT CHECK (spiciness >= 0 AND spiciness <= 3),
  author_id INTEGER,
  status VARCHAR(16) DEFAULT 'published',
  rating_avg NUMERIC(3,2) CHECK (rating_avg >= 1.0 AND rating_avg <= 5.0),
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Stores recipe data with multilingual support
**Key Fields**: Localised title/instructions (JSON for en/fi/ru), author reference, publication status, rating metrics

### Ingredients Table

```sql
CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Master list of ingredient names
**Key Fields**: Ingredient name (unique), creation timestamp

### Recipe Ingredients Join Table

```sql
CREATE TABLE recipe_ingredients (
  recipe_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  amount NUMERIC,
  unit VARCHAR(16),
  PRIMARY KEY (recipe_id, ingredient_id)
);
```

**Purpose**: Many-to-many relationship between recipes and ingredients
**Key Fields**: Amount and unit for each ingredient in a recipe

## Auth Database (MongoDB)

**Collection**: users
- Stores authentication credentials, password hashes, session tokens
- <unknown or lacking>: Exact schema for credentials storage

**Collection**: sessions
- <unknown or lacking>: Session token format and storage strategy

## Notification Database (PostgreSQL)

**Tables**: <unknown or lacking>
- Notification storage schema not fully documented

# Features List

## Core Features (Implemented)

| Feature | Description | Owner(s) | Status |
|---------|-------------|----------|--------|
| User Registration & Authentication | Secure user account creation and login | <unknown or lacking> | <unknown or lacking> |
| User Profiles | Customisable user profiles with avatar support | <unknown or lacking> | <unknown or lacking> |
| Recipe Creation | Users can create and publish recipes | <unknown or lacking> | <unknown or lacking> |
| Recipe Discovery | Browse and search recipes with filtering | <unknown or lacking> | <unknown or lacking> |
| Favourites | Save recipes to favourites list | <unknown or lacking> | <unknown or lacking> |
| Follow System | Follow other cooks, view follower lists | <unknown or lacking> | <unknown or lacking> |
| Comments | Leave comments on recipes | <unknown or lacking> | <unknown or lacking> |
| Recipe Ratings | Rate recipes (1–5 stars) | <unknown or lacking> | <unknown or lacking> |
| Multilingual Support | Interface in English, Finnish, Russian | <unknown or lacking> | <unknown or lacking> |
| Real-time Notifications | Push notifications for follows, comments, ratings | <unknown or lacking> | <unknown or lacking> |
| Responsive Design | Mobile and desktop compatibility | <unknown or lacking> | <unknown or lacking> |

# Modules

## Module Strategy

The project aims to implement a comprehensive set of modules from the ft_transcendence specification to reach the required 14-point minimum for evaluation.

## Planned Modules

**Major Modules (2 points each)**

- <unknown or lacking>

**Minor Modules (1 point each)**

- <unknown or lacking>

**Total Points**: <unknown or lacking>

## Module Justification

<unknown or lacking>

# Individual Contributions

## Contribution Breakdown by Team Member

| Team Member | Primary Responsibilities | Key Contributions | Modules Implemented |
|-------------|------------------------|-------------------|-------------------|
| <unknown or lacking> | <unknown or lacking> | <unknown or lacking> | <unknown or lacking> |
| <unknown or lacking> | <unknown or lacking> | <unknown or lacking> | <unknown or lacking> |
| <unknown or lacking> | <unknown or lacking> | <unknown or lacking> | <unknown or lacking> |
| <unknown or lacking> | <unknown or lacking> | <unknown or lacking> | <unknown or lacking> |
| <unknown or lacking> | <unknown or lacking> | <unknown or lacking> | <unknown or lacking> |

## Challenges & Solutions

**Challenge**: <unknown or lacking>
**Solution**: <unknown or lacking>

**Challenge**: <unknown or lacking>
**Solution**: <unknown or lacking>

# Additional Information

## Known Limitations

- <unknown or lacking>
- <unknown or lacking>

## Future Enhancements

- Advanced search with full-text indexing
- Recommendation algorithm based on user preferences
- Social features: direct messaging between users
- Recipe rating algorithms considering cook reputation
- Data export functionality for GDPR compliance

## License

ISC License

## Credits & Acknowledgements

- 42 School curriculum and evaluation framework
- Open-source community libraries and documentation
- Contributing team members and peer reviewers
