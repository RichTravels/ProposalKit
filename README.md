# ProposalKit

AI-powered document generation for solo consultants. Generate **Project Proposals**, **Statements of Work**, and **Post-Discovery Briefs** from a few inputs — authenticated, saved, and ready to refine.

Modeled after [RecruitKit](https://github.com/RichTravels/recruitkit)'s architecture: Next.js, Clerk, Supabase, Prisma, and Claude.

---

## Architecture

```
User signs in (Clerk)
        ↓
  [ensureUser] → upserts user into Postgres
        ↓
  [GenerateDocumentForm] → client context + discovery notes
        ↓
  [generateDocument action] → validates input, calls Claude
        ↓
  [DB Write] → saves to Document table (linked to User)
        ↓
  [Frontend] → renders result + library
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Authentication | Clerk |
| AI Generation | Anthropic Claude |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| Deployment | Vercel |

---

## Running Locally

```bash
cd ProposalKit
npm install
cp .env.example .env.local
# Fill in Clerk, Supabase, and Anthropic keys
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
proposalkit/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── proposal/generate|library/
│   │   │   ├── sow/generate|library/
│   │   │   └── brief/generate|library/
│   │   ├── actions/
│   │   │   ├── generateDocument.ts
│   │   │   └── deleteDocument.ts
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── components/
│   │   ├── GenerateDocumentForm.tsx
│   │   ├── DocumentLibrary.tsx
│   │   └── Header.tsx
│   └── lib/
│       ├── anthropic.ts
│       ├── db.ts
│       └── env.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── .env.example
```

---

## Database Schema

- **User** — synced from Clerk; tracks free-tier `generationQuota` (3 by default)
- **Document** — saved outputs with type (`PROPOSAL`, `SOW`, `BRIEF`), client title, content, and tone

---

## Next Steps

1. Create a Supabase project and run `npm run db:push`
2. Create a Clerk application and add keys to `.env.local`
3. Add an Anthropic API key
4. Deploy to Vercel
5. Add Stripe billing when you're ready to monetize
