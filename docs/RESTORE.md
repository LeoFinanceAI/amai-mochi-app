# Restoring a database backup

The `Respaldo Supabase` workflow (`.github/workflows/respaldo.yml`) dumps the
production database every 3 days and keeps the result as a 90-day artifact named
`respaldo-<run id>` with three files: `roles.sql`, `esquema.sql` and `datos.sql`.

The backup holds customer names, phones and addresses plus the user accounts
(emails and password hashes). Never commit it, share it or paste it anywhere:
`respaldo/` is git-ignored for that reason. Delete the local copy when done.

## Restore into the local Supabase (tested on 2026-10-31)

The schema comes from the migrations, which match production; only the data is
loaded from the backup. Commands are for Windows `cmd`, run from the repo root
with Docker Desktop running.

1. Download the artifact (Actions > Respaldo Supabase > the run > Artifacts) and
   unzip it into `respaldo/`:

   ```bash
   mkdir respaldo
   tar -xf "%USERPROFILE%\Downloads\respaldo-<run id>.zip" -C respaldo
   ```

2. Be on an up-to-date `main`, so every migration of production is present:

   ```bash
   git checkout main
   git pull origin main
   ```

3. Recreate the local database with the schema only (no seed data, which would
   collide with the backup). `--local` matters: `--linked` would wipe production.

   ```bash
   npx supabase start
   npx supabase db reset --local --no-seed
   ```

4. Load the data. Three things are required, each found the hard way:
   - Run as `supabase_admin`: `postgres` cannot write to Supabase Storage internal
     tables such as `storage.buckets_vectors`, even when they are empty.
   - Delete the rows the migrations create themselves (`public.configuration` id 1
     and the `attachments` bucket in `storage.buckets`), which the backup also
     contains.
   - `session_replication_role = replica` disables triggers and foreign keys while
     loading, so table order does not matter.

   `--single-transaction` rolls everything back on the first error, leaving the
   database empty rather than half-restored.

   ```bash
   docker cp respaldo\datos.sql supabase_db_atomic-crm-demo:/tmp/datos.sql
   docker exec supabase_db_atomic-crm-demo psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 --single-transaction -c "SET session_replication_role = replica" -c "DELETE FROM public.configuration" -c "DELETE FROM storage.buckets" -f /tmp/datos.sql
   ```

5. Check the counts against production, then sign in at `http://localhost:5173`
   (`npm run dev`) with a production account:

   ```bash
   docker exec supabase_db_atomic-crm-demo psql -U postgres -c "select (select count(*) from public.sabor) as sabores, (select count(*) from auth.users) as usuarios, (select count(*) from public.sales) as sales"
   ```

6. Clean up: delete the backup and go back to the test data.

   ```bash
   rmdir /s /q respaldo
   npx supabase db reset --local
   ```

## Restore into a new cloud project (not tested yet)

If the production project is lost, the expected path is: create a new Supabase
project, push the migrations with `npx supabase link` and `npx supabase db push`,
then load `datos.sql` as in step 4 against its connection string. Supabase cloud
does not expose `supabase_admin`, so the Storage permission issue of step 4 must
be solved another way (for example by removing the empty `storage` COPY blocks
from `datos.sql`). Rehearse this before relying on it.
