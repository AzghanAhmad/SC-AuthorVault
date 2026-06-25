# ── Stage 1: Build Angular frontend ──
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build -- --configuration production

# ── Stage 2: Build .NET API ──
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src

COPY backend/AuthorVault.Api.csproj backend/
RUN dotnet restore backend/AuthorVault.Api.csproj

COPY backend/ backend/
RUN dotnet publish backend/AuthorVault.Api.csproj -c Release -o /app/publish --no-restore

# ── Stage 3: Runtime ──
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/frontend/dist/authorvault/browser ./wwwroot/

RUN mkdir -p /app/uploads

EXPOSE 8080

ENTRYPOINT ["dotnet", "AuthorVault.Api.dll"]
