# AuthorVault — Deploy to Railway

## Recommended: reference MySQL from the web service

On your **web / Docker service** (not the MySQL service), open **Variables → Raw Editor** and add:

```env
MYSQL_URL=${{YourMySqlServiceName.MYSQL_URL}}
Jwt__Key=change-this-to-a-long-random-secret-at-least-32-chars
ASPNETCORE_ENVIRONMENT=Production
```

Replace `YourMySqlServiceName` with the exact name of your MySQL service in Railway (e.g. `MySQL` or `authorvault-mysql`).

For **private networking** (faster, no public proxy), use instead:

```env
MYSQL_PRIVATE_URL=${{YourMySqlServiceName.MYSQL_PRIVATE_URL}}
```

Railway resolves the full URL (host, user, password, database). Do **not** paste only the password unless you also set the correct host.

Click **Deploy** after saving.

---

## Alternative: manual connection string

Copy from **MySQL service → Connect** (host, port, user, password, database):

```env
ConnectionStrings__Default=Server=HOST;Port=PORT;Database=railway;User=root;Password=PASSWORD;SslMode=Required;
Jwt__Key=your-secret
ASPNETCORE_ENVIRONMENT=Production
```

---

## GitHub auto-deploy

1. Push to GitHub.
2. Railway project → **Deploy from GitHub** → uses root `Dockerfile`.
3. Set variables on the **web service** (steps above).
4. **Networking** → **Generate Domain**.

Every git push redeploys.

---

## Troubleshooting

### `Access denied for user 'root'@'100.64.x.x' (using password: YES)`

This means the app reached MySQL but **credentials are wrong** or you're not using the URL Railway generated.

**Fix:**
1. Variables must be on the **web service**, not only on the MySQL service.
2. Prefer `MYSQL_URL=${{YourMySqlService.MYSQL_URL}}` — do not rely on a stale password in `appsettings.Production.json`.
3. If using `MYSQLPASSWORD` alone, you **must** also set `RAILWAY_MYSQL_HOST` (and port) from MySQL → Connect.
4. Redeploy after changing variables.

Check **Deploy Logs** for `[DB]` lines:
- `Using MYSQL_URL` — good
- `Skipping unresolved Railway reference` — fix `${{ServiceName.VAR}}` spelling
- `No MYSQL/DATABASE env vars found` — variables on wrong service or not saved

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
# Set MYSQLPASSWORD=... and RAILWAY_MYSQL_HOST=... in .env
npm run docker:build
npm run docker:run
```
