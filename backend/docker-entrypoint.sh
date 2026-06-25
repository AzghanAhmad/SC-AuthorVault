#!/bin/sh
set -e

# Build ConnectionStrings__Default before .NET starts (Railway-friendly).
if [ -z "$ConnectionStrings__Default" ]; then
  if [ -n "$MYSQL_URL" ] && [ "${MYSQL_URL#*\$\{\{}" = "$MYSQL_URL" ]; then
    export ConnectionStrings__Default="$MYSQL_URL"
    echo "[entrypoint] Using MYSQL_URL"
  elif [ -n "$MYSQLHOST" ] && [ "${MYSQLHOST#*\$\{\{}" = "$MYSQLHOST" ]; then
    : "${MYSQLPORT:=3306}"
    : "${MYSQLUSER:=root}"
    : "${MYSQLDATABASE:=railway}"
    : "${MYSQLPASSWORD:=}"
    export ConnectionStrings__Default="Server=${MYSQLHOST};Port=${MYSQLPORT};Database=${MYSQLDATABASE};User=${MYSQLUSER};Password=${MYSQLPASSWORD};SslMode=Preferred;"
    echo "[entrypoint] Built connection string from MYSQLHOST"
  elif [ -n "$MYSQLPASSWORD" ]; then
    H="${RAILWAY_MYSQL_HOST:-thomas.proxy.rlwy.net}"
    P="${RAILWAY_MYSQL_PORT:-30264}"
    U="${RAILWAY_MYSQL_USER:-root}"
    D="${RAILWAY_MYSQL_DATABASE:-railway}"
    export ConnectionStrings__Default="Server=${H};Port=${P};Database=${D};User=${U};Password=${MYSQLPASSWORD};SslMode=Required;"
    echo "[entrypoint] Built connection string from MYSQLPASSWORD + RAILWAY_MYSQL_HOST (${H})"
  fi
fi

exec dotnet AuthorVault.Api.dll
