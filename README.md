# GAB Regularizacao & Oportunidades

Professional bilingual Next.js application for GAB Engenharia to identify, qualify, manage and monetize real estate opportunities with legal, fiscal, registry or administrative irregularities in Campinas and nearby cities.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui style components
- Local-first JSON storage with `localStorage`
- Vercel-ready deployment

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

## Environment Variables

Create `.env.local`:

```bash
ADMIN_EMAIL=admin@gab.local
ADMIN_PASSWORD=admin123
```

If these variables are not set, the app uses the same local defaults above for development.

## Login and Security V1

The app protects all pages with a simple HTTP-only cookie session. Credentials are checked by `/api/login` against `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

This is intentionally simple for V1. For multi-user production use, replace it with a managed auth provider and database-backed sessions.

## Data Storage

V1 uses browser `localStorage` as a local-first JSON store. The first load initializes sample data for:

- Campinas
- Paulinia
- Sumare
- Hortolandia
- Indaiatuba
- Valinhos

Use the `Recarregar exemplos` button to restore the seeded sample dataset.

## How To Add Data

Inside the app:

1. Log in.
2. Use `Novo imovel` to add a property.
3. Open `Proprietarios` and use `Novo proprietario` to add owners.
4. Link owners to properties from the property form.
5. Select a property to add document metadata, checklist items and CRM activities.
6. Open `Contratos` to preview bilingual contract templates using selected property and owner data.

To change the default seed data in code, edit:

- `src/lib/seed.ts`

## Internationalization

Translations live in:

- `src/lib/translations.ts`

The language switcher toggles between Brazilian Portuguese and French. Labels, menus, statuses, urgency levels, checklist statuses and activity types are translated.

## Deploy on Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Vercel Project Settings.
4. Deploy.

No database is required for V1. Because data is local-first, each browser keeps its own dataset.
