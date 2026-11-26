# What I asked the AI

Keep a short log. One entry per prompt is enough.

| What I asked (paste or summarize) | What happened | What I had to fix or check |
| --- | --- | --- |
| Set up my environment: Node.js, `.env` settings, and create my database `<NetID>_myapp` (step 3 prompt). | AI walked me through `npm install`, copying `.env.example` to `.env`, `npm run create-db`, and `npm run check`. | Had to be on UW Wi-Fi / Husky OnNet. Checked `npm run check` printed "OK: connected ... database <NetID>_myapp". Made sure `.env` is in `.gitignore`. |
| Build a page for my user story with made-up rows (step 4a prompt). | AI generated a generic "Product List" page and a `products` table instead of my study-tracker idea. `server/server.js` and `db/load.js` were committed as empty files. | Page showed nothing. I noticed it didn't match my IDEA.md at all. |
| "Help me fix this, I cannot see anything." | AI found `server.js` and `load.js` were empty (0 bytes), wrote an Express server with `/api/products` and a load script, loaded 5 sample rows. | Ran `npm start`, opened localhost:3000, and checked the table showed rows. AI pointed out it still didn't match my idea. |
| "I want a little timer for each of my studies: I set how long, it counts down, dark theme so it's relaxing, and lofi songs play when I hit start." | AI rebuilt the app: new `courses` and `study_sessions` tables, API routes to list/add subjects and start/finish sessions, a dark page with a countdown ring, and lofi music generated in the browser (no copyrighted songs). Wrote `db/queries.sql`. | Ran `node db/load.js` and restarted the server. Tested Start / Pause / End early and that sessions show up in "Recent sessions". All user input goes into SQL as parameters. |
| "Help me write and answer the assignment questions." | AI rewrote IDEA.md for the timer app, filled in this log, and added 20 made-up study sessions to `load.js` so the page shows real rows from my database. | Checked no password or `.env` is in git before pushing. Ran a query from `db/queries.sql` and compared with the page. Tried `' OR 1=1 --` as a subject name: it was just saved as text, no SQL injection. |
