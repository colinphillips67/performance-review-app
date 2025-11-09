# Database Migrations

This directory contains database migration files for schema changes.

## Creating a New Migration

1. Create a new file with a numbered prefix and descriptive name:
   ```
   001_add_column_to_users.sql
   002_create_new_table.sql
   ```

2. Write your migration SQL:
   ```sql
   -- 001_add_column_to_users.sql
   ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
   ```

3. Run the migration:
   ```bash
   npm run db:migrate
   ```

## Migration Rules

- Migrations are run in alphabetical order (use numeric prefixes)
- Each migration runs in a transaction
- Once executed, migrations are tracked in the `migrations` table
- Do not modify migrations that have already been run
- Always test migrations on a development database first

## Current Migrations

The initial schema is created by `database/schema.sql` during setup.
Future schema changes should be added as migration files in this directory.
