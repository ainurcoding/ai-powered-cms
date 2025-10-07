# Database Migrations

Folder ini berisi migration scripts untuk PostgreSQL database.

## Cara Menjalankan Migrations

### Menggunakan psql

```bash
# Connect ke database
psql -U postgres -d your_database_name

# Run migration file
\i database/migrations/001_create_users_table.sql
```

### Menggunakan Docker

```bash
# Copy file ke container postgres
docker cp database/migrations/001_create_users_table.sql <container_name>:/tmp/

# Execute migration
docker exec -it <container_name> psql -U postgres -d your_database_name -f /tmp/001_create_users_table.sql
```

## Struktur Penamaan

Format: `{nomor}_{deskripsi}.sql`

Contoh:
- `001_create_users_table.sql`
- `002_create_products_table.sql`
- `003_add_email_to_users.sql`

## Best Practices

1. Selalu gunakan `IF NOT EXISTS` untuk CREATE TABLE
2. Selalu gunakan `ON CONFLICT DO NOTHING` untuk INSERT data sample
3. Beri nama yang deskriptif untuk migration files
4. Jalankan migrations secara berurutan sesuai nomor
5. Jangan edit migration yang sudah dijalankan di production

