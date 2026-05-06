# Full-Stack FastAPI RBAC

[![Test Backend](https://github.com/t0ster/full-stack-fastapi/actions/workflows/test-backend.yml/badge.svg)](https://github.com/t0ster/full-stack-fastapi/actions/workflows/test-backend.yml)
[![Playwright Tests](https://github.com/t0ster/full-stack-fastapi/actions/workflows/playwright.yml/badge.svg)](https://github.com/t0ster/full-stack-fastapi/actions/workflows/playwright.yml)
[![Test Docker Compose](https://github.com/t0ster/full-stack-fastapi/actions/workflows/test-docker-compose.yml/badge.svg)](https://github.com/t0ster/full-stack-fastapi/actions/workflows/test-docker-compose.yml)

## Run locally with Docker Compose

Prereq:

- Docker / Docker Compose

Seed users are created automatically from `.env` on startup:

| Role    | Email                 | Password     |
| ------- | --------------------- | ------------ |
| admin   | `admin@example.com`   | `changethis` |
| manager | `manager@example.com` | `changethis` |
| member  | `member@example.com`  | `changethis` |

Start the full local stack:

```bash
docker compose watch
```

Useful URLs:

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8000>
- Swagger docs: <http://localhost:8000/docs>
- Mailcatcher: <http://localhost:1080>

On startup, `backend/scripts/prestart.sh` runs `alembic upgrade head`, then `backend/app/initial_data.py`. Seed creation is idempotent: existing admin/manager/member users are not overwritten.

Alternative frontend-local flow:

```bash
docker compose up -d --wait backend
cd frontend
bun install
bun run dev
```

## Database migrations

When running through Docker Compose, migrations run automatically in the `prestart` service.

Run migrations manually inside the backend container if needed:

```bash
docker compose exec backend alembic upgrade head
```

Or locally with uv:

```bash
cd backend
uv run alembic upgrade head
```

## Regenerate frontend client

After backend schema/API changes:

```bash
bash ./scripts/generate-client.sh
```

This updates `frontend/openapi.json` and generated files under `frontend/src/client/`.

## Tests and checks

Backend tests run on the host with uv, the same way as CI. Start the database and Mailcatcher first:

```bash
docker compose up -d db mailcatcher
cd backend
uv run bash scripts/prestart.sh
uv run bash scripts/tests-start.sh
```

Backend lint/typecheck:

```bash
cd backend
uv run ruff format --check app tests
uv run ruff check app tests
uv run mypy app tests
```

Frontend checks run on the host with Bun:

```bash
cd frontend
bun install
bunx biome check .
bun run build
```

Frontend Playwright tests also require the backend and Mailcatcher:

```bash
docker compose up -d --wait backend mailcatcher
cd frontend
bun run test
```

## RBAC

### Permission matrix

| Action                                  | admin | manager | member |
| --------------------------------------- | ----- | ------- | ------ |
| List all users                          | ✓     | ✓       | ✗      |
| Read another user                       | ✓     | ✓       | ✗      |
| Create user                             | ✓     | ✗       | ✗      |
| Update/delete any user                  | ✓     | ✗       | ✗      |
| View metrics                            | ✓     | ✓       | ✗      |
| View/update own profile                 | ✓     | ✓       | ✓      |
| Change own password                     | ✓     | ✓       | ✓      |
| Delete own account                      | ✗     | ✓       | ✓      |
| Basic own item CRUD                     | ✓     | ✓       | ✓      |
| Read/manage all items                   | ✓     | ✗       | ✗      |
| Admin email/password-recovery utilities | ✓     | ✗       | ✗      |

Role-to-permission mapping lives in `backend/app/core/rbac.py`:

| Role      | Permission values                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `admin`   | `users:read`, `users:manage`, `metrics:read`, `password-recovery:preview`, `test-email:send`, `items:read:all`, `items:manage:all` |
| `manager` | `users:read`, `metrics:read`                                                                                                       |
| `member`  | none; own-profile and own-item access are enforced by ownership checks                                                             |

### Implementation approach

Roles are stored on `User.role` as a enum (`admin`, `manager`, `member`). The database migration `backend/app/alembic/versions/a6c9d4f1e2b3_replace_is_superuser_with_role.py` adds the role column, backfills existing superusers as `admin`, defaults everyone else to `member`, and drops `is_superuser`.

`backend/app/core/rbac.py` defines `UserRole`, `Permission`, and `ROLE_PERMISSIONS`. Routes use `require_permission(...)` from `backend/app/api/deps.py` for route-level checks. Resource ownership checks stay local to the route when they depend on the target row, e.g. users can read/update themselves and item owners can manage their own items.

The backend is the source of truth for capabilities. `User.permissions` derives permissions from `User.role`, and `UserPublic.permissions` returns those derived values from `/users/me`. The frontend client is generated from OpenAPI, so the TypeScript `Permission` type follows the backend enum.

The frontend uses permissions for UX only: hiding sidebar links/buttons and guarding `/admin` and `/metrics`. Security still lives on the backend. Logged-out users are redirected to `/login`; logged-in users without a required permission stay on the requested route and see an `Access Denied` page.
