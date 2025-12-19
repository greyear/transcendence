### DATABASE CHOICE:
Non-relational databases are not suitable for this project because the system relies on strong relationships, data integrity, and transactional consistency. User management, permissions, and concurrent operations require guarantees that relational databases like PostgreSQL provide out of the box.
**PostgreSQL** was selected due to its strong support for relational data, transactions, and data consistency, which are critical for user management, permissions, and concurrent operations.
It also provides advanced indexing and full-text search capabilities while fitting well into a microservices architecture with strict data ownership and isolation.
Additionally, PostgreSQL is widely used in modern development, making it a practical choice for gaining relevant industry experience.

### MICROSERVICES:
The system is divided into microservices based on business domains: authentication, user management, and content management. Each service owns its data and encapsulates a single responsibility, while the API Gateway acts as a unified entry point handling routing, security, and cross-cutting concerns.
Business logic lives inside services and cross-cutting concerns live at the gateway level.
**API Gateway**
Responsibility:
Acts as a single entry point for all client requests.
Contains:
Request routing to internal services
JWT validation and authentication middleware
Rate limiting and API key validation
Request/response logging
Basic request validation
Response aggregation (if needed)
Does NOT contain:
Business logic
Database access
**Auth Service**
Responsibility:
Manages authentication and user identity.
Contains:
User registration and login
Password hashing and verification
JWT and refresh token generation
OAuth 2.0 integration (optional)
Two-factor authentication logic (optional)
Token revocation and session management
Database: auth_db
**User Service**
Responsibility:
Manages user profiles, social interactions, and permissions.
Contains:
User profile management
Avatar upload metadata
Friends system (add/remove/list)
User roles and permissions
Online status tracking
User profile retrieval
Database: user_db
**Recipe Service**
Responsibility:
Manages recipes and user-generated content.
Contains:
Recipe CRUD operations
Ingredients and tags management
Ratings and comments
Advanced search and filtering
Full-text search
Recommendation logic (or integration point)
Database: recipe_db