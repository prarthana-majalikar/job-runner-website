# Graph Analysis Job Runner

A web interface for running `backend.sh` on uploaded files.

## What it does
- Accepts file uploads < 1MB
- Runs `backend.sh`
- Returns a **token** — users can return later to retrieve results
- Displays stdout + stderr from the script

## Project structure
```
webapp/
├── server.js          # Express backend
├── public/index.html  # Frontend
├── scripts/
│   ├── backend.sh     # The analysis script
│   ├── checksum.c     # C source (compiled to ./checksum on deploy)
│   └── checksum       # Compiled binary (after build)
├── jobs/              # Job state files (created at runtime)
├── uploads/           # Temporary upload storage (auto-cleaned)
├── nixpacks.toml      # Railway build config
└── package.json
```

## Run locally

```bash
# Install dependencies
npm install

# Compile the C program
gcc -o scripts/checksum scripts/checksum.c

# Start the server
npm start
# → http://localhost:3000
```

## API

| Endpoint | Method | Description |
|---|---|---|
| `POST /submit` | multipart/form-data, field: `inputfile` | Submit a job, returns `{ token }` |
| `GET /status/:token` | — | Poll job status, returns job JSON |

Job JSON shape:
```json
{
  "token": "uuid",
  "filename": "original.el",
  "status": "running|done|failed",
  "submitted": "ISO timestamp",
  "completed": "ISO timestamp",
  "output": "stdout string",
  "error": "stderr string"
}
```
