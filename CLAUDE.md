@AGENTS.md

# Notes App — Development Guidelines

## TypeScript
- Strict mode, no `any`
- File naming: kebab-case for files, PascalCase for components

## Styling
- Tailwind + shadcn/ui components only — no custom CSS except in globals.css
- Dark theme is default; use CSS variables for all colors
- Mobile-responsive but desktop-first layout

## Supabase
- Use server client (`lib/supabase/server.ts`) in server components
- Use browser client (`lib/supabase/client.ts`) in client components
- Every mutation must respect RLS — `user_id` must match `auth.uid()`

## Components
- Use `"use client"` only when necessary (forms, interactivity, Plate.js editor)
- Animations: subtle for navigation, snappier for checklist interactions (Framer Motion)

## Data Model
- A tile's type (`checklist` or `sections`) is locked at creation time and cannot be changed
