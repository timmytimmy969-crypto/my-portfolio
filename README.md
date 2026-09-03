# FRAME — portfolio CMS

## Deploy in five steps

1. Push this project to GitHub and create a **Postgres** database (Vercel Postgres, Neon, or Supabase).
2. In Vercel, create a Blob store and connect it to this project. Vercel automatically adds `BLOB_READ_WRITE_TOKEN`.
3. Add all variables from `.env.example` in Vercel Project Settings. Generate `AUTH_SECRET` with a password manager; never use the example value.
4. Locally, run `npm install`, then `npx prisma migrate dev --name init`, then set the seed variables and run `npm run db:seed`. This creates the first private owner and starter portfolio.
5. Deploy. Visit `/admin/login` and sign in with the seeded email/password. Change the password in the database or add a password-management screen before production use.

## Content workflow

Use **Save draft** while working. **Preview** opens the exact draft-only portfolio with a prominent banner. **Publish** copies the current draft into the public snapshot atomically; visitors at `/portfolio/<slug>` only read that snapshot. Upload media directly in the studio—files go to Vercel Blob and only their persistent URLs are stored in Postgres.

## Adding future owners

Create a `User` with a bcrypt password hash and a linked `Portfolio` record using a unique slug. Each authenticated owner is scoped by `userId`; their draft, assets metadata and live snapshot are never queried through another owner’s admin session.

## Environment variables

- `DATABASE_URL`: pooled PostgreSQL connection string.
- `AUTH_SECRET`: 32+ character random server-only session secret.
- `BLOB_READ_WRITE_TOKEN`: server-only Vercel Blob token.
- `NEXT_PUBLIC_APP_URL`: the Vercel domain for links.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`: used only for the one-time seed command; do not add them to Vercel.

Vercel Blob has a 4.5 MB serverless request limit for this route. For larger production video files, use Vercel Blob client uploads (or an upload provider such as Mux/Cloudinary) and retain the same URL/metadata architecture.
