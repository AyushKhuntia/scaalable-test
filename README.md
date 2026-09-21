# SCAALABLE — Web Dialer + CRM

Full-stack web dialer + CRM for SCAALABLE company.

- **frontend/** — React (light sky blue theme)
- **backend/** — Spring Boot + MySQL + Twilio

## Roles

| Role  | Permissions |
|-------|-------------|
| ADMIN | Full control: user management (add users with roles), leads, assignments, dialer |
| MANAGER | Manage leads, assign leads to agents, view data |
| AGENT | Work assigned leads: place calls (Twilio), save dispositions & notes, view follow-ups |

**Default login:** `admin` / `admin` (seeded automatically on first backend startup)

## Database

MySQL database `scaalable_crm`. Schema is in
`backend/src/main/resources/schema.sql` — tables:

- `users` — all system users with role (ADMIN / MANAGER / AGENT)
- `leads` — prospect records to be called
- `lead_assignments` — lead → agent assignment history
  (active row = `unassigned_at IS NULL`; re-assign closes the old row first)
- `dispositions` — call outcomes (CONNECTED, NO_ANSWER, …)
- `call_logs` — every Twilio call with SID, status, duration, recording URL
- `follow_ups` — scheduled callbacks

## Run with Docker (everything in one command)

```bash
docker compose up --build
```

Starts three containers:

| Container | URL | What |
|---|---|---|
| scaalable-mysql | localhost:3306 | MySQL 8, data persisted in the `mysql-data` volume |
| scaalable-backend | localhost:8080 | Spring Boot API |
| scaalable-frontend | **http://localhost:3000** | React app (nginx serves the build, proxies `/api` to backend) |

Log in at http://localhost:3000 with `admin` / `admin`.

To plug in Twilio, set env vars before `docker compose up`:

```bash
TWILIO_ACCOUNT_SID=ACxxxx TWILIO_AUTH_TOKEN=xxxx TWILIO_PHONE_NUMBER=+15551234567 docker compose up --build
```

(or put them in a `.env` file next to `docker-compose.yml` — without them the
dialer runs in DRY-RUN mode).

To wipe the database: `docker compose down -v`

## Run without Docker

### Run the backend

1. Install MySQL, note your root password.
2. Edit `backend/src/main/resources/application.yml`:
   - `spring.datasource.password` → your MySQL password
   - `twilio.account-sid`, `auth-token`, `phone-number` → your Twilio credentials
     (without them the dialer runs in **DRY-RUN** mode and the whole flow still works)
3. Start it:

   ```bash
   cd backend
   mvn spring-boot:run
   ```

   Runs on http://localhost:8080. First startup creates the DB, tables,
   the default admin, and the standard dispositions.

### Run the frontend

```bash
cd frontend
npm install
npm start
```

Runs on http://localhost:3000. Log in with `admin` / `admin`.

## Typical flow

1. **ADMIN** → Users → create MANAGER and AGENT users (with roles + phone).
2. **ADMIN/MANAGER** → Leads → create leads.
3. **ADMIN/MANAGER** → Leads → "Assign to Agent".
4. **AGENT** → My Leads → 📞 Call → Dialer places the Twilio call → save
   disposition + notes.
