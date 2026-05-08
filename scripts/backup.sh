#!/bin/bash

# Configuration
DB_NAME=${DB_NAME:-unstress}
BACKUP_DIR=${BACKUP_DIR:-$HOME/.unstress/backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: Permission Denied - Cannot create backup directory $BACKUP_DIR"
    exit 1
fi

# Perform backup and compress
# We pipe pg_dump to gzip to save space and avoid intermediate files
pg_dump "$DB_NAME" 2>/tmp/pg_dump_error | gzip > "$BACKUP_FILE" 2>/tmp/gzip_error

# Check for errors
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    if grep -q "No space left on device" /tmp/gzip_error; then
        echo "ERROR: Disk Full - Cannot write backup to $BACKUP_DIR"
    elif grep -q "Permission denied" /tmp/pg_dump_error || grep -q "Permission denied" /tmp/gzip_error; then
        echo "ERROR: Permission Denied - Check database or filesystem permissions"
    else
        ERROR_MSG=$(cat /tmp/pg_dump_error /tmp/gzip_error)
        echo "ERROR: Backup Failed - $ERROR_MSG"
    fi
    rm -f "$BACKUP_FILE"
    exit 1
fi

echo "SUCCESS: Backup created at $BACKUP_FILE"
exit 0
