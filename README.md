# Progress Map

An interactive atlas of Nigeria government projects tracking their progress from planning to completion. Progress Map provides a browsable map of federal, state, and LGA projects: every marker opens a detailed report about project status, budget utilization, implementation timeline, and progress updates with sourced evidence.

![](public/progress-map.png)

Explore 200 curated project reports tracking Nigeria government initiatives from federal to local levels.

<p align="center">
  <img src="public/report-kandahar.png" width="32%" alt="Sample project report" />
  <img src="public/report-kalimantan.png" width="32%" alt="Sample project report" />
  <img src="public/report-theranos.png" width="32%" alt="Sample project report" />
</p>

Progress Map is a transparency and accountability tool. It tracks the lifecycle of government projects across Nigeria: planned, ongoing, completed, stalled, and abandoned initiatives with budget data, contractor information, and timeline tracking.

## Features

### Interactive Atlas

- **Globe-first map** - Explore Nigeria government projects through a Mapbox globe with custom sector symbols.
- **200 bundled projects** - Browse a curated atlas of documented projects across infrastructure, health, education, power, water, and more.
- **Dense-marker handling** - Nearby projects group cleanly without losing individual reports.
- **Random discovery** - Jump to a random project when you want serendipity instead of search.
- **Responsive reading** - Open detailed reports without leaving the map context.

### Project Reports

- **Cited Markdown reports** - Every bundled project links to a source-backed report under `public/reports`.
- **Clear project anatomy** - Reports show status, budget, timeline, contractor information, and progress updates.
- **Numbered citation integrity** - Cached reports keep numbered citations aligned with the source list in `src/data/examples.json`.
- **Source metadata** - Each atlas entry preserves source URLs, confidence, coordinates, tier (federal/state/LGA), sector, and status.

### Live Deep Research

- **Research any place or idea** - Click the map or search a subject to launch a Valyu DeepResearch investigation.
- **Effort controls** - Low, Medium, and High research settings map to Fast, Standard, and Heavy modes.
- **Progress activity** - Research progress surfaces meaningful provider steps instead of invented percentages.
- **Public sharing** - Publish a completed report to create a revocable public `/?share=<id>` link.
- **Completion notifications** - Hosted or configured self-hosted installs can send report-ready emails through Valyu.

### Discovery And Evidence

- **Project photos** - The app discovers bounded public images through Valyu search results and keeps source attribution.
- **Nigeria archive links** - Nigerian reports can link readers into archivi.ng with period-aware search windows.
- **Map-aware research prompts** - Location research preserves the selected geographic scope and does not invent anchors for worldwide ideas.
- **Safe public reads** - Shared reports expose only explicitly published, sanitized report fields and source URLs.

### Curation Pipeline

- **Batch curation files** - Regional files in `scripts/curated` hold the human-written title, subtitle, summary, lesson, category, and corrected coordinates.
- **Isolated validation** - `scripts/check-curated.ts` checks one curated batch without rewriting shared outputs.
- **Draft generation** - `scripts/build-entries.ts` converts curated entries into atlas records and Markdown reports.
- **Safe publishing** - `scripts/merge-entries.ts` folds the generated draft into `src/data/examples.json` and refuses thin, malformed, or source-less entries.

## Why This Exists

Government project transparency drives accountability and learning.

Progress Map treats project tracking as essential public infrastructure. Each report asks:

- What project was planned or implemented?
- Which ministry, department, or agency is responsible?
- Where is it located (state, LGA)?
- What is the budget breakdown (appropriated, released, spent)?
- Who is the contractor?
- What is the current status and timeline?
- What evidence supports these claims?
- What can citizens and future projects learn?

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, Tailwind CSS, custom components
- **Map**: Mapbox GL JS with globe projection
- **Research**: Valyu DeepResearch API
- **Auth**: Valyu OAuth 2.1 with PKCE in hosted mode
- **State**: Zustand
- **Markdown**: react-markdown and remark-gfm
- **Validation**: zod and Node test runner
- **Analytics**: Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Mapbox public token
- Valyu API key

### Installation

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/jsodeh/global-fail-map.git
cd global-fail-map
pnpm install
```

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Configure self-hosted mode:

```env
NEXT_PUBLIC_APP_MODE=self-hosted
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk_your_public_token
VALYU_API_KEY=valyu_your_api_key
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## App Modes

### Self-Hosted Mode

Self-hosted mode uses your server-side `VALYU_API_KEY` and does not require a database.

```env
NEXT_PUBLIC_APP_MODE=self-hosted
VALYU_API_KEY=valyu_your_api_key
```

Research history is read from `GET /v1/deepresearch/list` for that key. Optionally set `DEEPRESEARCH_ALERT_EMAIL` to an email in your Valyu organization and set `NEXT_PUBLIC_APP_URL` to the reachable app URL so completion emails point back to the correct report.

### Hosted Valyu Mode

Hosted mode lets users sign in with Valyu. OAuth tokens stay in encrypted HTTP-only cookies, and research requests pass through the Valyu OAuth proxy.

```env
NEXT_PUBLIC_APP_MODE=valyu
NEXT_PUBLIC_APP_URL=https://your-app.example
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk_your_public_token
NEXT_PUBLIC_VALYU_AUTH_URL=https://your-auth-host.example
NEXT_PUBLIC_VALYU_CLIENT_ID=your_client_id
VALYU_CLIENT_SECRET=your_client_secret
VALYU_SESSION_SECRET=at_least_32_random_characters
VALYU_APP_URL=https://platform.valyu.ai
```

Allow `https://your-app.example/auth/valyu/callback` in the OAuth client.

## Using The Atlas

### Browse Projects

- Click any marker to open the project panel.
- Use filters to focus on federal, state, or LGA projects.
- Filter by sector, status, or tier.
- Use random project mode to jump through the archive.
- Open the full report to inspect citations and source links.

### Research A New Subject

- Search for a place, project, company, or idea.
- Choose research effort in Advanced settings when needed.
- Wait for the report to complete or reopen it later with `/?research=<id>`.
- Publish the report only when you want a public `/?share=<id>` link.

### Refresh Bundled Reports

The bundled reports are cached Markdown files. Their task IDs and source metadata live in `src/data/examples.json`.

```bash
pnpm sync:examples
```

This command requires a configured Valyu CLI session. It fails if any task is incomplete instead of publishing partial output. Cached reports may contain hand-reviewed factual corrections, so review the diff before replacing them.

## Curation Workflow

Curated entries live in regional JSON files under `scripts/curated`.

Validate one batch:

```bash
npx tsx scripts/check-curated.ts scripts/curated/africa.json
```

Build generated draft entries and reports:

```bash
npx tsx scripts/build-entries.ts
```

Merge the generated draft into the atlas:

```bash
npx tsx scripts/merge-entries.ts
```

The merge step protects the published atlas from duplicate IDs, repeated subtitles, colon titles, missing coordinates, thin lessons, and missing sources.

## Project Structure

```text
progress-map/
├── public/
│   ├── progress-map.png           # README screenshot
│   └── reports/                   # Cached Markdown reports
├── scripts/
│   ├── curated/                   # Regional curated project batches
│   ├── build-entries.ts           # Generates draft entries and reports
│   ├── check-curated.ts           # Validates one curated batch
│   ├── merge-entries.ts           # Publishes generated entries to the atlas
│   └── sync-example-reports.mjs   # Refreshes reports from Valyu tasks
├── src/
│   ├── app/                       # Next.js routes and API endpoints
│   ├── components/auth/           # Valyu auth UI
│   ├── components/fail-map/       # Globe, dock, markers, reports, legend
│   ├── components/ui/             # Shared UI primitives
│   ├── data/examples.json         # Published atlas entries
│   └── lib/                       # Types, stores, auth, archiving, utilities
└── tests/                         # Node test runner coverage
```

## API Routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/investigations` | `POST` | Create a Valyu DeepResearch task |
| `/api/investigations` | `GET` | List authenticated research tasks |
| `/api/investigations/[id]` | `GET` | Poll a task or read a completed report |
| `/api/investigations/[id]` | `PATCH` | Publish or revoke a shared report |
| `/api/auth/valyu/start` | `GET` | Start OAuth sign-in with PKCE |
| `/api/auth/valyu/session` | `GET/DELETE` | Read or clear the hosted auth session |

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## License

MIT. See [LICENSE](LICENSE).
