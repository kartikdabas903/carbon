# Supabase Accounts and Cloud History

1. Create a Supabase project and open its SQL Editor.
2. Run the contents of `backend/supabase_schema.sql` once. This creates the account-owned prediction, recommendation, choice, and goal tables with row-level security enabled.
3. In Project Settings → API, copy the Project URL and service-role key into `backend/.env`:

   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. Copy the Project URL and anon/publishable key into `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

   For older Supabase projects, `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted.

5. In Supabase Authentication URL settings, set the local site URL and allowed redirect URL to `http://localhost:3000`.
6. Restart CarbonShift with `run.cmd`, then create an account at `/signup`.

The service-role key is backend-only and bypasses row-level security. FastAPI verifies each Supabase access token and scopes every query to that verified user ID. Never put the service-role key in `frontend/.env.local` or commit either `.env` file.

The app stores prediction inputs/results, recommendations, chosen actions, and the user's approved reduction target. It does not store full chat transcripts. Recent saved plans and choices are summarized by the backend and passed to the model only to personalize alternatives; the model cannot query PostgreSQL directly.