# AuthorVault — Deploy to Railway

## Quickest fix (3 variables on the WEB service)

Open your **web app service** → **Variables** → **Raw Editor** and paste:

```env
MYSQLPASSWORD=your-mysql-password-here
Jwt__Key=change-this-to-a-long-random-secret-at-least-32-chars
ASPNETCORE_ENVIRONMENT=Production
```

Get the MySQL password from: **MySQL service** → **Connect** → copy **Password**.

Default host/port (`thomas.proxy.rlwy.net` / `30264`) are built in automatically. Override if yours differ:

```env
RAILWAY_MYSQL_HOST=your-host.proxy.rlwy.net
RAILWAY_MYSQL_PORT=30264
RAILWAY_MYSQL_DATABASE=railway
RAILWAY_MYSQL_USER=root
```

Click **Deploy** after saving variables.

---

## Alternative: full connection string

On the **web service** only:

```env
ConnectionStrings__Default=Server=HOST;Port=PORT;Database=railway;User=root;Password=PASSWORD;SslMode=Required;
Jwt__Key=your-secret
ASPNETCORE_ENVIRONMENT=Production
```

---

## Alternative: reference MySQL service

On the **web service**, add reference variable:

- Name: `MYSQL_URL`
- Value: `${{YourMySQLServiceName.MYSQL_URL}}`

(Replace `YourMySQLServiceName` with the exact name shown in Railway.)

---

## GitHub auto-deploy

1. Push to GitHub.
2. Railway project → **Deploy from GitHub** → uses root `Dockerfile`.
3. Set variables on the **web service** (steps above).
4. **Networking** → **Generate Domain**.

Every git push redeploys.

---

## Troubleshooting

Check **Deploy Logs** for lines starting with `[DB]`:
- `No MYSQL/DATABASE env vars found` → variables are on the wrong service or not saved.
- `Skipping unresolved Railway reference` → reference syntax wrong; use Raw Editor or copy password manually as `MYSQLPASSWORD`.

**Never** put database variables only on the MySQL service — they must be on the **web/Docker service**.

If registration fails after deploy, open `/health` — you should see `"database": "connected"`. If migrations were broken, connect to MySQL and run:

```sql
DROP TABLE IF EXISTS __EFMigrationsHistory;
```

Then redeploy so migrations run cleanly from scratch.

---

## Local Docker

```bash
cp .env.example .env
# Set MYSQLPASSWORD=... in .env
npm run docker:build
npm run docker:run
```
