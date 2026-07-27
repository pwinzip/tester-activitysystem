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

# 1) Create your config from the template
cp .env.docker.example .env.docker

# 2) Generate your own secrets and paste them into .env.docker
openssl rand -base64 48   # -> BETTER_AUTH_SECRET
openssl rand -base64 32   # -> OTP_HASH_PEPPER
#    also set POSTGRES_PASSWORD (and the same password inside DATABASE_URL)
#    and ASSESSMENT_CONFIRMATION_TOKEN to any secret string.

# 3) Start
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

### Configuration & secrets

All Docker configuration lives in **`.env.docker`** (copied from
`.env.docker.example`; it is git-ignored so your secrets are never committed).
Both containers read it.

- **You must generate your own** `BETTER_AUTH_SECRET`, `OTP_HASH_PEPPER`, and set
  a `POSTGRES_PASSWORD` — see the `openssl` commands above. `DATABASE_URL` must
  contain the same `POSTGRES_PASSWORD` value.
- **SMTP is not needed** for the class: with `MAIL_PROVIDER=console` the OTP is
  printed to the app log (`docker compose logs -f web`), so `SMTP_HOST` /
  `SMTP_USER` / `SMTP_PASS` can stay blank. Only fill them (and set
  `MAIL_PROVIDER=smtp`) if you want real email delivery.
- Which template? **Docker → `.env.docker` (from `.env.docker.example`).**
  For the “Run without Docker” path below use `.env` (from `.env.example`).
  `.env.assessment.example` / `.env.production.example` are references for other
  deployments.

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

### Assessment maintenance commands — what they do and when to use them

**`assessment:reset -- T01`** — re-runs one tester back to a clean starting
state **without touching the other 21**. Use it when a tester has already
consumed their data (verified their OTP, checked in, changed their activity
status, or registered a throw-away account) and needs to run the scenario again.
It re-marks the pending account unverified with a fresh OTP, clears that
activity’s attendance/attempts, revokes their sessions, restores the activity to
OPEN, and deletes any stray account they registered.

```bash
docker compose exec web npm run assessment:reset -- T01
```

**`assessment:export`** — regenerates the teacher-only credentials/assignment
CSV in `artifacts/` (emails, passwords, QR URLs, datasets, fixed OTPs). Use it
if you lost the file from the seed step or changed `ASSESSMENT_EMAIL_MODE`.
(The random `admin.demo` password is shown only during `assessment:seed`.)

```bash
docker compose exec web npm run assessment:export
```

**`assessment:purge -- <token>`** — deletes **all** assessment data (the 22
testers, staff, admin.demo, their activities and assignments) and nothing else.
Use it to wipe everything after the assessment period, or before a clean
re-seed. The `<token>` must equal `ASSESSMENT_CONFIRMATION_TOKEN` from
`.env.docker` (a safety guard so it can’t run by accident).

```bash
docker compose exec web npm run assessment:purge -- <ASSESSMENT_CONFIRMATION_TOKEN>
```

> Typical lifecycle: `assessment:seed` once → students work → `assessment:reset -- Txx`
> as needed for retries → `assessment:purge` at the end.

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
