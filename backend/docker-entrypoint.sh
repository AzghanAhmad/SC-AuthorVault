#!/bin/sh
set -e

is_resolved() {
  case "$1" in
    *'${{'*) return 1 ;;
    *) return 0 ;;
  esac
}

# Build ConnectionStrings__Default before .NET starts (Railway-friendly).
if [ -z "$ConnectionStrings__Default" ]; then
  for URL_VAR in MYSQL_URL MYSQL_PRIVATE_URL MYSQL_PUBLIC_URL DATABASE_URL DATABASE_PRIVATE_URL; do
  eval "URL_VAL=\$$URL_VAR"
  if [ -n "$URL_VAL" ] && is_resolved "$URL_VAL"; then
    case "$URL_VAL" in
      mysql://*|mysql2://*)
        export ConnectionStrings__Default="$URL_VAL"
        echo "[entrypoint] Using $URL_VAR"
        break
        ;;
      Server=*)
        export ConnectionStrings__Default="$URL_VAL"
        echo "[entrypoint] Using $URL_VAR (ADO.NET)"
        break
        ;;
    esac
  fi
  done
fi

if [ -z "$ConnectionStrings__Default" ]; then
  if [ -n "$MYSQLHOST" ] && is_resolved "$MYSQLHOST"; then
    : "${MYSQLPORT:=3306}"
    : "${MYSQLUSER:=root}"
    : "${MYSQLDATABASE:=railway}"
    : "${MYSQLPASSWORD:=}"
    export ConnectionStrings__Default="Server=${MYSQLHOST};Port=${MYSQLPORT};Database=${MYSQLDATABASE};User=${MYSQLUSER};Password=${MYSQLPASSWORD};SslMode=Preferred;"
    echo "[entrypoint] Built connection string from MYSQLHOST"
  elif [ -n "$MYSQLPASSWORD" ] && [ -n "$RAILWAY_MYSQL_HOST" ]; then
    P="${RAILWAY_MYSQL_PORT:-3306}"
    U="${RAILWAY_MYSQL_USER:-root}"
    D="${RAILWAY_MYSQL_DATABASE:-railway}"
    export ConnectionStrings__Default="Server=${RAILWAY_MYSQL_HOST};Port=${P};Database=${D};User=${U};Password=${MYSQLPASSWORD};SslMode=Required;"
    echo "[entrypoint] Built connection string from MYSQLPASSWORD + RAILWAY_MYSQL_HOST (${RAILWAY_MYSQL_HOST})"
  fi
fi

exec dotnet AuthorVault.Api.dll
