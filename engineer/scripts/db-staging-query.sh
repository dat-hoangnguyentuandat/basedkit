#!/bin/bash
# Query staging database (read-only)
# Usage: .claude/scripts/db-staging-query.sh "SELECT * FROM users LIMIT 5"
#
# Required .env variables:
#   DB_STAGING_SSH_HOST, DB_STAGING_SSH_USER, DB_STAGING_SSH_KEY
#   DB_STAGING_USER, DB_STAGING_PASSWORD, DB_STAGING_DATABASE

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

DB_STAGING_SSH_HOST=$(load_env_var "DB_STAGING_SSH_HOST")
DB_STAGING_SSH_USER=$(load_env_var "DB_STAGING_SSH_USER")
DB_STAGING_SSH_KEY=$(load_env_var "DB_STAGING_SSH_KEY")
DB_STAGING_USER=$(load_env_var "DB_STAGING_USER")
DB_STAGING_PASSWORD=$(load_env_var "DB_STAGING_PASSWORD")
DB_STAGING_DATABASE=$(load_env_var "DB_STAGING_DATABASE")

# Validate required vars
MISSING=""
[ -z "$DB_STAGING_SSH_HOST" ] && MISSING="$MISSING DB_STAGING_SSH_HOST"
[ -z "$DB_STAGING_SSH_USER" ] && MISSING="$MISSING DB_STAGING_SSH_USER"
[ -z "$DB_STAGING_SSH_KEY" ] && MISSING="$MISSING DB_STAGING_SSH_KEY"
[ -z "$DB_STAGING_USER" ] && MISSING="$MISSING DB_STAGING_USER"
[ -z "$DB_STAGING_PASSWORD" ] && MISSING="$MISSING DB_STAGING_PASSWORD"
[ -z "$DB_STAGING_DATABASE" ] && MISSING="$MISSING DB_STAGING_DATABASE"

if [ -n "$MISSING" ]; then
    echo "Error: Missing required .env variables:$MISSING"
    exit 1
fi

# Expand ~ in SSH key path
DB_STAGING_SSH_KEY="${DB_STAGING_SSH_KEY/#\~/$HOME}"

ssh -i "$DB_STAGING_SSH_KEY" "$DB_STAGING_SSH_USER@$DB_STAGING_SSH_HOST" \
    "mysql -u $DB_STAGING_USER -p'$DB_STAGING_PASSWORD' $DB_STAGING_DATABASE -e \"$QUERY\""
