# Recipe Sharing Platform - team, progress and assignment summary.

## Requirements Summary (Pages 4-9 of subject v19.0)

These requirements are mostly mandatory and common to all transcendence projects.

### 1) Team Organisation and Management

Teams are required to consist of at least 4 and at most 5 members. Ours consisted of 5 members at kick-off.

#### 1.1) Team members

Our team consists of 5 members:
	- Anya Zinchenko (azinchen)
	- Nick Saveliev (msavelie)
	- Eric Lehtonen (elehtone)
	- Jimi Karhu (jkarhu)
	- Seela Salorinta (ssalorin)

#### 1.2) Mandatory Roles

- **Product Owner (PO)**: Owns product vision, priorities, backlog, and validation of completed work.
	- Anya and Nick shared this role at various stages during the project.
- **Project Manager (PM) / Scrum Master**: Coordinates planning, communication, deadlines, risks, and blockers.
	- Anya was our project manager.
- **Technical Lead / Architect**: Leads architecture and stack decisions, code quality, and critical reviews.
	- This role fell to our member Nick.
- **Developers (all members)**: Implement features, review code, test, and document contributions.
	- All 5 of us were developers to various degrees.

#### 1.3) Recommended Project Management Practices

Although not strictly mandatory, the subject strongly recommends:

- Regular group meetings. Very concise meeting notes available [here](meetings.md).
- Clear task planning using GitHub Issues & Kanban board as well as Discord.
- Work was generally broken into manageable parts and we aimed to have single issue pull requests.
- Peer review was mandatory for all pull requests.
- Ongoing documentation of decisions.
- A dedicated communication channel via Discord.

During evaluation each team member must be able to explain their contributions, as well as the project as a whole.

### 2) Mandatory Project Scope

The application idea is chosen by the team, but it must satisfy mandatory core constraints as well as the requirements of the chosen modules.

#### 2.1) General Mandatory Requirements

The following are required; failure to comply can lead to rejection:

- Build a full web app with **frontend, backend, and database**.
- Use **Git** with meaningful commits and visible contribution from all members.
- Use containerised deployment (**Docker**) runnable with a **single command**.
- Ensure compatibility with the latest stable **Google Chrome**.
- Keep browser console free from warnings/errors in normal use.
- Include accessible **Privacy Policy** and **Terms of Service** pages with relevant content (not placeholders).

#### 2.2) Multi-user Support

The application must support simultaneous users correctly:

- Multiple users can be active concurrently.
- Concurrent actions are handled safely.
- Real-time updates propagate appropriately where applicable.
- No race-condition-driven corruption in shared actions/data.

#### 2.3) Technical Mandatory Requirements

- Frontend must be clear, responsive, and accessible across device sizes.
- Use a styling solution/framework of your choice (for example Tailwind, Bootstrap, Material UI, Styled Components).
- Keep credentials in local `.env` ignored by Git, and provide an `.env.example`.
- Database design must have a clear schema and defined relationships.
- Implement secure baseline user management:
	- Sign-up and login with email/password.
	- Password handling must be properly secured (hashing + salting).
	- Extra auth (Google OAuth)) can be added via modules, for extra points.
- Validate all form/user input in both frontend and backend.
- Use **HTTPS** for backend communication.

### 3) Technical choices

For this subject, a framework is treated as a structured architecture with conventions for code organisation. It also has features for common tasks and an ecosystem of tools and extensions.

- Frontend: React/React-Router
- Backend: Express
- Containerisation: Docker

## Modules summary (Pages 10 to 21 of subject)

In addition to the mandatory basic redquirements we need to choose modules. Major modules have a value of 2 points, minor a value of 1. We need to have 14 points in order to have a completed project.

Our plan is to have modules totalling 20 points when we are done. This gives us flexibility should problems or unseen issues arrive. This also gives us flexibility should an evaluator encounter a critical failure.

### 1) Web modules

1. Major: Use a framework for both the frontend and backend.
	- Use a frontend framework (React, Vue, Angular, Svelte, etc.).
 	- Use a backend framework (Express, NestJS, Django, Flask, Ruby on Rails, etc.).
 	- Full-stack frameworks (Next.js, Nuxt.js, SvelteKit) count as both if you use both their frontend and backend capabilities.

2. Minor: Server-Side Rendering (SSR) for improved performance and SEO.

3. Minor: Custom-made design system with reusable components, including a proper color palette, typography, and icons (minimum: 10 reusable components).

4. Minor: Implement advanced search functionality with filters, sorting, and pagination.

Total points: 5

### 2) Accessibility and Internationalisation modules

1. Major: Complete accessibility compliance (WCAG 2.1 AA) with screen reader support, keyboard navigation, and assistive technologies.

2. Minor: Support for multiple languages (at least 3 languages).
 	- Implement i18n (internationalization) system.
 	- At least 3 complete language translations.
 	- Language switcher in the UI.
 	- All user-facing text must be translatable.

3. Minor: Support for additional browsers.
 	- Full compatibility with at least 2 additional browsers (Firefox, Safari, Edge, etc.).
 	- Test and fix all features in each browser.
 	- Document any browser-specific limitations.
 	- Consistent UI/UX across all supported browsers.

Total points: 4

### 3) User Management modules

1. Major: Standard user management and authentication.
 	- Users can update their profile information.
	- Users can upload an avatar (with a default avatar if none provided).
 	- Users can add other users as friends and see their online status.
 	- Users have a profile page displaying their information.

2. Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.).

3. Major: Advanced permissions system
	 - View, edit, and delete users (CRUD).
	 - Roles management (admin, user, guest, moderator, etc.).
	 - Different views and actions based on user role.

Total points: 5

### 4) Artificial Intelligence modules

1. Major: Implement a complete RAG (Retrieval-Augmented Generation) system.
 	- Interact with a large dataset of information.
 	- Users can ask questions and get relevant answers.
 	- Implement proper context retrieval and response generation.

2. Major: Recommendation system using machine learning.
 	- Personalized recommendations based on user behavior.
 	- Collaborative filtering or content-based filtering.
 	- Continuously improve recommendations over time.

Total points: 4

### 5) Devops modules

1. Major: Backend as microservices.
 	- Design loosely-coupled services with clear interfaces.
 	- Use REST APIs or message queues for communication.
 	- Each service should have a single responsibility.

Total points: 2