# DATABASE CHOICE:
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

# MICROSERVICES:
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

# KUBERNETES:
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


