# notes-app

Personal organization app — bento dashboard of project tiles.

Built phase-by-phase with Claude Code. See `notes-app-prompts.docx`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Supabase (Postgres, Auth, Storage)
- Plate.js (rich text editor)
- Framer Motion

## Local development

```bash
npm install
cp .env.local.example .env.local  # then fill in Supabase keys
npm run dev
```
