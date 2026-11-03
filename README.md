# Quizly web

Next.js frontend for the quiz MVP. It talks to the Spring Boot API at `http://localhost:8081/api` by default.

## Run locally

1. Start the backend from `../funny-game` with `./mvnw spring-boot:run` (Java 17+).
2. Copy `.env.local.example` to `.env.local` if you want to change the API URL.
3. Run `npm install`, then `npm run dev` in this directory.
4. Open http://localhost:3000.

The MVP includes quiz discovery, category filtering, search, account registration/login, and quiz ownership. Signed-in users can create, edit, delete, and filter their own quizzes, and choose whether each quiz is public or private. Private quizzes appear only in the owner's list and cannot be opened or hosted by another user. Quiz creation supports up to 50 multiple choice questions; self-paced play shows answer feedback and a final score. Hosts can open a six-digit PIN room; players join with a display name, each question has a configurable 10–60 second timer, fast correct answers earn a bonus, and the room shows a live score table. Completed room results are saved and appear under **Lịch sử** for the account that hosted the room. The backend reveals the answer when time expires and automatically advances after five seconds; hosts can also advance manually. Room credentials are kept in the current tab's session storage so a page reload can reconnect, and WebSocket reconnects automatically with polling as a fallback.

Quiz content and password hashes are stored in local H2. Login tokens live in backend memory for 12 hours and are invalidated when Spring Boot restarts. Active PIN rooms are held in backend memory, expire after four hours, and are cleared when Spring Boot restarts. Room state changes are pushed over WebSocket, with a 10-second polling fallback. Set `FRONTEND_ORIGIN` on the backend to the deployed frontend origin when hosting outside localhost.
