# Group meetings

1. 12/12/2025 - Initial meeting. Discussed ideas for projects and desired roles for team members.
   1. Recipe website was decided on
   2. Chose possible modules. Initial points total: 23
   3. Roles were discussed and loosely decided
      - Backend team: Anya, Eric, Jimi
      - Frontend team: Nick, Seela
   4. Frameworks chosen:
      - Frontend: React, React Router
      - Backend: Express
      - Containerisation: Docker, Kubernetes
2. 19/12/2025 - Discussed architecture, information flow and storage.
   1. Three services: Auth, User, Recipes
      - API gateway orchestrating data transfer between them
   2. Initial UI ideas were shared and conceptualised in Figma.
3. 13/1/2026
   1. Auth DB decided on mongoDB
   2. Sharing more UI work
   3. All members updating on their research
4. 23/1/2026 - Just a general catch up meeting
   1. passport.js chosen for authentication
5. 28/1/2026
   1. Aim to start actively developing before February begins
   2. Aim to be finished by April
   3. Eric should get to know JWT
   4. Kanban board set up on GitHub
6. 2/2/2026
   1. Pull requests require at least one code review before merge
   2. First proper commits start happening
7. 9/2/2026
   1. UI work in full flow, lots of ideas and progress by Nick and Seela
8. 12/2/2026 -  Short meeting no new work items, just progress on existing work
9. 20/2/2026 - First meeting with all members present
10. 27/2/2026
    1. TypeScript migration
    2. Seela getting React set up
    3. Anya working on error handling in core and gateway.
    4. Eric starting on /register and /login
       - passport.js dropped in favour of bcrypt due to simplicity
11. 4/3/2026
    1. Lots of commits happening at this time. Work progressing well.
    2. Biome installed
       - Formatting and linting
12. 11/3/2026
    1. Eric working on JWT validation and password change
    2. Seela and Nick doing lots of work on UI components
    3. Anya working on testing and recipe endpoints
13. 20/3/2026
14. 25/3/2026
15. 27/3/2026
16. 31/3/2026
17. 7/4/2026
18. 9/4/2026
    1. Re-evaluated our modules and points. Still over 14.
       - However, some uncertainty about which modules we are working on and what some of them entail.
       - Language of recipes discussed
       - Online/offline status system discussed
       - Admin console discussed
       - Username vs. real name
       - User delete discussed
19. 13/4/2026
    1. Lots of snags to deal with:
       - Recipe filters (Anya & Frontend)
       - Pagination (Anya)
       - WCAG compliance (Nick)
       - Browser limitations that may affect us (Nick)
       - README (Anya)
       - Language (EN, FI, RU) (Anya & Jimi)
       - Search (Jimi)
       - Online status (Nick)
       - Profile page (Eric & Nick)
       - Displayed name on profile, vs. username vs. realname (Frontend)
       - User delete (Anya, Eric & Frontend)
       - Default avatar (Frontend)
       - GET user endpoint in auth (Eric & Frontend)
       - Favourite recipes (Anya)
       - HTTPS
       - Privacy policy / Terms and conditions (Nick)
       - localhost:3000 to localhost in the docs (Anya)
20. 14/4/2026
    1. Discussion about online status
    2. Discussion about username
       - Choice made to remove usernames and only authenticate with email or Google
21. 15/4/2026
22. 16/4/2026 - Group work together at Hive
    1. Integration and debugging of integration
    2. Anya: Pagination and follower endpoints
	3. Eric: Documentation and repo cleaning.
	4. Nick: Working on recipe creation
	5. Seela: Recipe reviews and fixing a 401/token issue
23. 17/4/2026 
	1. Anya: GET recipe review
	2. Jimi: Fixing his complex PR
	3. Seela: Google login FE part. PR reviewing.
	4. Eric: Documentation. Fix issue with error 11000. Fix Logout PR.
24. 