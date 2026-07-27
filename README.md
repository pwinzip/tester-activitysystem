# SciDI Activity Check-in System

Faculty activity attendance via QR check-in — and a case-study platform for the
Software Quality Assurance course. Built with **Next.js (App Router), Prisma,
PostgreSQL, Better Auth, and Docker**.

Everything runs **locally with Docker** — no VPS required. Each student clones
the repo and runs their own isolated copy.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git

> Node.js is only needed if you want to run tests / the dev server directly on
> your machine (Section “Run without Docker”). The Docker path needs Docker only.

---

## Quick start (Docker)

```bash
git clone <your-repo-url> scidi-activity-checkin
cd scidi-activity-checkin
docker compose up --build
```

On first start the app automatically applies database migrations. When you see
the app listening, open:

- Web app: <http://localhost:3000>
- API health: <http://localhost:3000/api/health>

Stop with `Ctrl+C`. To stop and remove containers: `docker compose down`.
To also wipe the database volume: `docker compose down -v`.

> **Ports:** if `3000` or `5432` are already used on your machine, start with
> overrides, e.g. `WEB_PORT=3005 DB_PORT=5434 docker compose up --build`.

---

## Seed the assessment data (22 students)

The stack defaults to the **assessment** profile. After the app is running, open
a second terminal and seed the 22-student data set:

```bash
docker compose exec web npm run assessment:seed
```

This creates: 1 instructor admin, 9 staff, 22 verified students, 22 pending
students, 22 activities + QR tokens, and 22 assignments. It also writes a
**teacher-only** credentials file to `artifacts/` inside the container and prints
the random `admin.demo` password to the console — copy it somewhere safe.

Read the exported credentials out of the container:

```bash
docker compose exec web sh -c 'ls -1 artifacts && cat artifacts/assessment-credentials-*.csv'
```

Other assessment commands:

```bash
# Reset ONE tester's data (does not affect others)
docker compose exec web npm run assessment:reset -- T01

# Re-export the teacher credentials CSV
docker compose exec web npm run assessment:export

# Purge ALL assessment data (needs the confirmation token)
docker compose exec web npm run assessment:purge -- local-purge-token
```

### Email / OTP in the test environment

- Emails are **not** actually sent — the OTP is printed to the app console
  (`MAIL_PROVIDER=console`). Watch the `web` logs: `docker compose logs -f web`.
- With `ASSESSMENT_FIXED_OTP_ENABLED=true` (the default), each pending tester has
  a **fixed OTP**: `T01 → 410001`, `T02 → 410002`, … `T22 → 410022`.
- Test emails follow the workbook (`student01@qa.local`, `pending01@qa.local`, …).
  To use real university emails (`{studentId}@tsu.ac.th`) re-seed with
  `ASSESSMENT_EMAIL_MODE=real` set in the environment.

> **QR note (local):** QR links point to `http://localhost:3000/checkin/<token>`,
> which resolves on the same machine. To check in, open that URL in a browser on
> the same computer (scanning from a separate phone won’t reach `localhost`).

---

## Running tests, Postman, and load tests

The app runs in Docker; your QA activities run against it.

- **Jest (white-box, Week 5):** you write your own tests under `tests/` and run
  them on your machine (see “Run without Docker”). `npm test` and
  `npm run test:coverage`. The pure functions to test live in
  `src/server/services/` (e.g. `student-id.ts`, `otp.ts`, `activity-transition.ts`,
  `checkin.ts`, `report-access.ts`).
- **API tests (Postman / Week 6):** target `http://localhost:3000/api/...`.
- **Load tests (k6):** target the running app; schedule per group.

---

## Run without Docker (optional, for tests / dev)

```bash
cp .env.example .env                       # then edit secrets
docker compose up -d db                    # just the database
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev                                # http://localhost:3000
```

Useful scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:coverage` | Jest (add your own tests under `tests/`) |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Minimal dev seed |
| `npm run db:studio` | Prisma Studio |
| `npm run assessment:seed` | Seed the 22-student assessment set |
| `npm run assessment:reset -- T01` | Reset one tester |
| `npm run assessment:purge -- <token>` | Purge assessment data |
| `npm run assessment:export` | Export teacher credentials CSV |

---

## Submitting assessment answers

Record your results in the provided **`Student_Response_Templates.xlsx`**, one
sheet per task (`W1_Quality`, `W2_SDLC_STLC`, `W2_Smoke`, `W3_Requirements`,
`W3_RTM`, `W4_*`, `W5_*`, `W6_*`, `Evidence`, `Presentation_Summary`). Attach
your Jest files, coverage report, Postman collection, and evidence as instructed.

---

## Operational profiles

Set via `APP_MODE` (see `docker-compose.yml` / `.env*.example`):

- `development` — local development.
- `assessment` — the class profile: fixed OTP allowed, seed/reset/purge scripts,
  safe assessment scenarios. **Default in Docker.**
- `production` — safest defaults; refuses to start if fixed-OTP is enabled.

Security notes: passwords are hashed by Better Auth; OTPs are stored only as
salted hashes; role/scope checks are enforced on the backend for every protected
API; the database is not exposed publicly in a real deployment.
