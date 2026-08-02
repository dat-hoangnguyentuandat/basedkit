#!/bin/bash
# Query local database (read-only)
# Usage: .claude/scripts/db-local-query.sh "SELECT * FROM users LIMIT 5"

QUERY="$1"

if [ -z "$QUERY" ]; then
    echo "Usage: $0 \"SQL_QUERY\""
    echo "Example: $0 \"SELECT COUNT(*) FROM users\""
    exit 1
fi

mysql -u root -proot jam_easychatgpt_backend -e "$QUERY"
