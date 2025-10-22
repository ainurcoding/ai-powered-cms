#!/bin/bash
# Script to run all database migrations in order
# Usage: ./database/run-migrations.sh

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database connection details
DB_HOST="${DB_HOST_POSTGRES:-localhost}"
DB_PORT="${DB_PORT_POSTGRES:-5432}"
DB_NAME="${DB_NAME_POSTGRES:-ai_cms_db}"
DB_USER="${DB_USER_POSTGRES:-postgres}"

echo "🚀 Starting database migrations..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Export password for psql
export PGPASSWORD="${DB_PASS_POSTGRES}"

# Run migrations in order
migrations=(
    "002_create_users_table_uuid.sql"
    "003_create_categories_table.sql"
    "004_create_tags_table.sql"
    "005_create_posts_table.sql"
    "006_create_post_tags_table.sql"
    "007_create_media_table.sql"
)

for migration in "${migrations[@]}"; do
    echo "📄 Running migration: $migration"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "database/migrations/$migration"
    
    if [ $? -eq 0 ]; then
        echo "✅ $migration completed successfully"
    else
        echo "❌ $migration failed!"
        exit 1
    fi
    echo ""
done

echo "🎉 All migrations completed successfully!"

