# AuthorVault — Deploy to Railway

Single Docker image: **Angular frontend** + **.NET API** + **MySQL** (Railway).

## Railway setup (GitHub auto-deploy)

1. Push this repo to **GitHub**.
2. Railway → **New Project** → **Deploy from GitHub repo**.
3. Add a **MySQL** database service to the same project.
4. **Link MySQL to your web service** (this fixes the connection error):

### Option A — Reference `MYSQL_URL` (easiest)

1. Open your **web app service** (the one running the Dockerfile — not the MySQL service).
2. Go to **Variables** → **New Variable** → **Add Reference**.
3. Select your **MySQL** service → choose **`MYSQL_URL`**.
4. Name the variable on the web service: `MYSQL_URL`
5. Save — Railway redeploys automatically.

### Option B — Reference individual variables

On the **web service**, add these reference variables from your MySQL service:

| Variable on web service | Reference value |
|-------------------------|-----------------|
| `MYSQLHOST` | `${{MySQL.MYSQLHOST}}` |
| `MYSQLPORT` | `${{MySQL.MYSQLPORT}}` |
| `MYSQLUSER` | `${{MySQL.MYSQLUSER}}` |
| `MYSQLPASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `MYSQLDATABASE` | `${{MySQL.MYSQLDATABASE}}` |

Replace `MySQL` with your database service’s exact name in Railway.

### Option C — Manual connection string

On the **web service** only:

```
ConnectionStrings__Default=Server=YOUR_HOST;Port=YOUR_PORT;Database=railway;User=root;Password=YOUR_PASSWORD;SslMode=Required;
Jwt__Key=your-long-random-secret-at-least-32-characters
ASPNETCORE_ENVIRONMENT=Production
```

Also required on the web service:

```
Jwt__Key=your-long-random-secret-at-least-32-characters
ASPNETCORE_ENVIRONMENT=Production
```

5. **Settings → Networking → Generate Domain** for your public URL.
6. Every **git push** triggers a new deploy.

## Troubleshooting

**`No database connection configured`**

- Variables must be on the **web service**, not only on MySQL.
- Use **Add Reference** from the MySQL service — do not copy localhost values.
- After adding variables, trigger a **Redeploy**.

## Security

- Never commit passwords or JWT secrets to git.
- Rotate credentials if they were exposed.

## Local Docker test

```bash
cp .env.example .env   # fill in values
npm run docker:build
npm run docker:run
```

Open http://localhost:8080
