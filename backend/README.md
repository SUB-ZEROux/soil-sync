# Soil Sync backend

A small, secure REST API for the existing static frontend. It persists crop posts, comments, and contact messages in SQLite and stores uploaded images on disk.

## Run locally

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API runs at `http://localhost:3000`.

## Endpoints

- `GET /api/health` — health check
- `GET /api/crops?limit=20&offset=0` — list crop posts and comments
- `POST /api/crops` — multipart upload with `photo`, `description`, and `location`
- `POST /api/crops/:id/comments` — JSON `{ "username": "...", "text": "..." }`
- `POST /api/contact` — JSON `{ "name", "email", "type", "message" }`
- `GET /uploads/<filename>` — uploaded image files

For production, mount a persistent volume for `DB_FILE` and `UPLOAD_DIR`, or replace the storage adapter with object storage and managed PostgreSQL.

## Connecting the current HTML frontend

The current page intentionally uses an in-memory JavaScript array. Replace those form handlers with `fetch` calls to the endpoints above and set `API_BASE` to the deployed API URL. The upload request must use `FormData`—do not set its `Content-Type` manually.
