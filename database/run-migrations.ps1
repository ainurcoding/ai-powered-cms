# PowerShell script to run all database migrations in order
# Usage: .\database\run-migrations.ps1

Write-Host "🚀 Starting database migrations..." -ForegroundColor Cyan

# Load environment variables from .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#].+?)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Database connection details
$DB_HOST = if ($env:DB_HOST_POSTGRES) { $env:DB_HOST_POSTGRES } else { "localhost" }
$DB_PORT = if ($env:DB_PORT_POSTGRES) { $env:DB_PORT_POSTGRES } else { "5432" }
$DB_NAME = if ($env:DB_NAME_POSTGRES) { $env:DB_NAME_POSTGRES } else { "ai_cms_db" }
$DB_USER = if ($env:DB_USER_POSTGRES) { $env:DB_USER_POSTGRES } else { "postgres" }

Write-Host "Database: $DB_NAME" -ForegroundColor Yellow
Write-Host "Host: ${DB_HOST}:${DB_PORT}" -ForegroundColor Yellow
Write-Host "User: $DB_USER" -ForegroundColor Yellow
Write-Host ""

# Set password environment variable for psql
$env:PGPASSWORD = $env:DB_PASS_POSTGRES

# Run migrations in order
$migrations = @(
    "002_create_users_table_uuid.sql",
    "003_create_categories_table.sql",
    "004_create_tags_table.sql",
    "005_create_posts_table.sql",
    "006_create_post_tags_table.sql",
    "007_create_media_table.sql",
    "008_add_avatar_bio_to_users.sql",
    "009_add_google_id_to_users.sql",
    "010_allow_null_password_for_google_oauth.sql"
)

foreach ($migration in $migrations) {
    Write-Host "📄 Running migration: $migration" -ForegroundColor Cyan
    
    $filePath = "database\migrations\$migration"
    
    # Run psql command
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $filePath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $migration completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ $migration failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

Write-Host "🎉 All migrations completed successfully!" -ForegroundColor Green

