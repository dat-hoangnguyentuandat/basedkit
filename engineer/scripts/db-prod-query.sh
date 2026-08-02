#!/bin/bash
# Query prod database (read-only)
# Usage: .claude/scripts/db-prod-query.sh "SELECT * FROM users LIMIT 5"
#
# Required .env variables:
#   DB_PROD_SSH_HOST, DB_PROD_SSH_USER, DB_PROD_SSH_KEY
#   DB_PROD_USER, DB_PROD_PASSWORD, DB_PROD_DATABASE

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

QUERY="$1"

if [ -z "$QUERY" ]; then
    echo "Usage: $0 \"SQL_QUERY\""
    echo "Example: $0 \"SELECT COUNT(*) FROM users\""
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Load env variables
load_env_var() {
    grep "^$1=" "$ENV_FILE" | cut -d '=' -f2- | sed "s/^['\"]//;s/['\"]$//"
}

DB_PROD_SSH_HOST=$(load_env_var "DB_PROD_SSH_HOST")
DB_PROD_SSH_USER=$(load_env_var "DB_PROD_SSH_USER")
DB_PROD_SSH_KEY=$(load_env_var "DB_PROD_SSH_KEY")
DB_PROD_USER=$(load_env_var "DB_PROD_USER")
DB_PROD_PASSWORD=$(load_env_var "DB_PROD_PASSWORD")
DB_PROD_DATABASE=$(load_env_var "DB_PROD_DATABASE")

# Validate required vars
MISSING=""
[ -z "$DB_PROD_SSH_HOST" ] && MISSING="$MISSING DB_PROD_SSH_HOST"
[ -z "$DB_PROD_SSH_USER" ] && MISSING="$MISSING DB_PROD_SSH_USER"
[ -z "$DB_PROD_SSH_KEY" ] && MISSING="$MISSING DB_PROD_SSH_KEY"
[ -z "$DB_PROD_USER" ] && MISSING="$MISSING DB_PROD_USER"
[ -z "$DB_PROD_PASSWORD" ] && MISSING="$MISSING DB_PROD_PASSWORD"
[ -z "$DB_PROD_DATABASE" ] && MISSING="$MISSING DB_PROD_DATABASE"

if [ -n "$MISSING" ]; then
    echo "Error: Missing required .env variables:$MISSING"
    exit 1
fi

# Expand ~ in SSH key path
DB_PROD_SSH_KEY="${DB_PROD_SSH_KEY/#\~/$HOME}"

ssh -i "$DB_PROD_SSH_KEY" "$DB_PROD_SSH_USER@$DB_PROD_SSH_HOST" \
    "mysql -u $DB_PROD_USER -p'$DB_PROD_PASSWORD' $DB_PROD_DATABASE -e \"$QUERY\""
