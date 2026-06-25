# AuthorVault API (.NET 10 + MySQL)

ASP.NET Core Web API for the ScribeCount / AuthorVault Angular frontend.

## Quick start

1. Start **MySQL** in XAMPP.
2. From this folder:

```bash
npm start
```

The API runs at **http://localhost:5059/api**.

The database `authorvault` is **created automatically** on first run. Schema changes are applied automatically via **EF Core migrations** whenever you start the API.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the API |
| `npm run dev` | Run with hot reload (`dotnet watch`) |
| `npm run build` | Build the project |
| `npm run db:add-migration -- Name` | Add a new migration after model changes |
| `npm run db:migrate` | Apply migrations manually (optional — `npm start` does this) |

## Configuration

Edit `appsettings.Development.json`:

```json
"ConnectionStrings": {
  "Default": "Server=localhost;Port=3306;Database=authorvault;User=root;Password=;"
}
```

Adjust `User` / `Password` if your XAMPP MySQL credentials differ.

## Frontend

```bash
cd ../frontend
npm start
```

Angular: **http://localhost:4200**

## AWS S3 (file uploads)

Without AWS credentials, files are stored in `uploads/` locally.

```json
"AWS": {
  "AccessKeyId": "YOUR_KEY",
  "SecretAccessKey": "YOUR_SECRET",
  "Region": "us-east-1",
  "S3BucketName": "your-bucket"
}
```

## Deploy to Railway (production)

See **[DEPLOY.md](../DEPLOY.md)** at the repo root for Docker + GitHub + Railway MySQL setup.

Quick variable names for Railway:

- `ConnectionStrings__Default` — full MySQL connection string with `SslMode=Required`
- `Jwt__Key` — production JWT secret (32+ chars)
- `PORT` — set automatically by Railway

