# Toodo Supabase Setup

## 1. Create a Supabase project

Create a Supabase project from the Supabase dashboard.

## 2. Run the schema

Open the Supabase SQL Editor and run:

```text
supabase/toodo_schema.sql
```

This creates:

- `public.toodo_meta`
- `public.toodo_yearly_workspaces`
- RLS policies that restrict each row to `auth.uid() = user_id`

## 3. Configure authentication

Use Supabase Auth email/password login. If email confirmation is enabled, users must confirm the email before first login.

## 4. Add Vercel environment variables

Add these to the Vercel project in Production and Preview environments:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Do not add `service_role`, `sb_secret_...`, database passwords, or direct connection strings to Vercel frontend environment variables.

## Data model

```text
┌──────────────────────────┐
│ public.toodo_meta        │
│ user_id uuid primary key │
│ meta jsonb               │
└────────────┬─────────────┘
             │
             │ user_id
             ▼
┌───────────────────────────────┐
│ public.toodo_yearly_workspaces│
│ user_id uuid                  │
│ year integer                  │
│ data jsonb                    │
│ primary key (user_id, year)   │
└───────────────────────────────┘
```
