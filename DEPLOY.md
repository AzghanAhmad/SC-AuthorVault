# AuthorVault — Deploy to Railway

Single Docker image: **Angular frontend** + **.NET API** + **MySQL** (Railway).

## Railway setup (GitHub auto-deploy)

1. Push this repo to **GitHub**.
2. In [Railway](https://railway.app): **New Project** → **Deploy from GitHub repo** → select your repo.
3. Railway detects `Dockerfile` and `railway.toml` at the repo root.
4. Add a **MySQL** database (or use your existing Railway MySQL).
5. On your **web service**, open **Variables** and set:

| Variable | Value |
|----------|--------|
| `ConnectionStrings__Default` | `Server=HOST;Port=PORT;Database=railway;User=root;Password=YOUR_PASSWORD;SslMode=Required;` |
| `Jwt__Key` | A long random secret (32+ characters) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

**Or** link the MySQL service to the web service — Railway injects `MYSQLHOST`, `MYSQLPORT`, etc. automatically.

6. **Settings** → **Networking** → **Generate Domain** to get your public URL.
7. Every **push to GitHub** triggers a new build and deploy.

## Security

- **Do not commit** database passwords or JWT secrets to git.
- Copy `.env.example` to `.env` for local Docker tests only (`.env` is gitignored).
- Rotate your MySQL password if it was ever exposed.

## Local Docker test

```bash
cp .env.example .env   # fill in values
npm run docker:build
npm run docker:run
```

Open http://localhost:8080
