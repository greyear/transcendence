# Recipe Sharing Platform - team and progress.



## Subject Requirements Summary (Pages 4-10)

This document summarises the project requirements and goals from pages 4 to 10 of `en.subject-19.0.pdf`, using a format aligned with the main `README.md`.

### 1) Project Goals

The project aims to develop both technical and collaborative capabilities through a long-form team build:

- Deliver a real-world web application as a team.
- Strengthen creativity, self-confidence, adaptability, and teamwork.
- Ensure every member contributes to both the mandatory core and selected modules.
- Demonstrate genuine understanding of design and implementation decisions during evaluation.

### 2) Team Organisation and Management

#### 2.1) Mandatory Roles

Each team must define and document roles in `README.md`.

- **Product Owner (PO)**: Owns product vision, priorities, backlog, and validation of completed work.
- **Project Manager (PM) / Scrum Master**: Coordinates planning, communication, deadlines, risks, and blockers.
- **Technical Lead / Architect**: Leads architecture and stack decisions, code quality, and critical reviews.
- **Developers (all members)**: Implement features, review code, test, and document contributions.

Team size guidance:

- **4 members**: Some members hold multiple roles.
- **5 members**: Roles can be more specialised.

#### 2.2) Recommended Delivery Practices

Although not strictly mandatory, the subject strongly recommends:

- Regular sync meetings (weekly or fortnightly).
- Clear task tracking (for example GitHub Issues, Trello, or a shared document).
- Breaking work into smaller tasks.
- Peer review of important changes.
- Ongoing documentation of decisions.
- A dedicated communication channel (for example Discord or Slack).

During evaluation, the team must explain role distribution, work organisation, communication, and each member's contribution.

### 3) Mandatory Project Scope

The application idea is chosen by the team, but it must satisfy the mandatory core constraints.

Example project directions include:

- Multiplayer games with matchmaking/tournaments.
- Social or collaborative platforms with real-time interaction.
- Other creative web applications that still meet all constraints.

### 4) General Mandatory Requirements

The following are required; failure to comply can lead to rejection:

- Build a full web app with **frontend, backend, and database**.
- Use **Git** with meaningful commits and visible contribution from all members.
- Use containerised deployment (**Docker/Podman/equivalent**) runnable with a **single command**.
- Ensure compatibility with the latest stable **Google Chrome**.
- Keep browser console free from warnings/errors in normal use.
- Include accessible **Privacy Policy** and **Terms of Service** pages with relevant content (not placeholders).

#### 4.1) Multi-user Support (Mandatory)

The application must support simultaneous users correctly:

- Multiple users can be active concurrently.
- Concurrent actions are handled safely.
- Real-time updates propagate appropriately where applicable.
- No race-condition-driven corruption in shared actions/data.

### 5) Technical Mandatory Requirements

- Frontend must be clear, responsive, and accessible across device sizes.
- Use a styling solution/framework of your choice (for example Tailwind, Bootstrap, Material UI, Styled Components).
- Keep credentials in local `.env` ignored by Git, and provide an `.env.example`.
- Database design must have a clear schema and defined relationships.
- Implement secure baseline user management:
	- Sign-up and login with email/password.
	- Password handling must be properly secured (hashing + salting).
	- Extra auth (OAuth/2FA) can be added via modules.
- Validate all form/user input in both frontend and backend.
- Use **HTTPS** for backend communication.

### 6) Framework Clarification (As Defined in Subject)

For this subject, a framework is treated as a structured ecosystem with architecture conventions and built-in tooling.

- Frontend examples: React, Vue, Angular, Svelte, Next.js.
- Backend examples: Express, Fastify, NestJS, Django, Flask, Ruby on Rails.
- Non-framework examples: jQuery, Lodash, Axios.

Note: The subject explicitly treats React as a framework in this context.
