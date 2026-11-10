# JobTrackr

A job application tracker that helps you learn from your job search, not just record it. Move applications across a Kanban board, get flagged when one needs a follow-up, and see which resume version and which kinds of roles actually lead to interviews.

I built it for my own graduate job search: my inbox told me *what* happened to each application, but never *why*.

![JobTrackr board with applications in Saved, Applied, Interview, Offer and Rejected columns](docs/screenshots/board.png)

## Features

- **Kanban board.** Drag applications between Saved, Applied, Interview, Offer and Rejected, with a mouse, by touch, or with the keyboard.
- **Follow-up flags.** Anything still in Applied after 14 days is highlighted, so no application goes quiet unnoticed.
- **Resume version tracking.** Record which tailored resume you sent to each company.
- **Insights.** Response rate, interview rate, and interview rate by resume version and role type. Small samples are marked so one lucky application doesn't read as "100% success".
- **Backup.** Export and import your data as JSON. Imports are validated and merged, never overwritten blindly.
- **Sample data.** One click loads a realistic board, so you can try it without typing anything.

| Insights | Add / edit | Mobile |
|---|---|---|
| ![Insights page with interview rate charts](docs/screenshots/insights.png) | ![Edit application dialog](docs/screenshots/edit-form.png) | ![Board on a phone](docs/screenshots/mobile-board.png) |

## Tech stack

| Area | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript, built with Vite | Type safety and fast builds. Vite outputs static files, ideal for S3 + CloudFront hosting |
| Styling | Tailwind CSS v4 with design tokens | Colours and fonts defined once in `index.css` and used everywhere |
| State | Zustand with `persist` | Small and simple. All data access goes through one store, so swapping localStorage for an API later touches one file |
| Forms | React Hook Form + Zod | One Zod schema is both the TypeScript type and the validation rules |
| Drag and drop | dnd-kit | Maintained, and supports keyboard and screen readers |
| Charts | Recharts, lazy-loaded | Only downloaded when Insights is opened |
| Testing | Vitest + Testing Library | 32 unit and component tests, including full user flows |

## Engineering decisions worth calling out

- **Accessibility first.** Keyboard drag and drop with screen-reader announcements, a native `<dialog>` for focus trapping, form errors linked to their inputs, and a table view behind every chart. A component test caught a header button that screen readers would have read as "Addapplication".
- **Colour-blind-safe status palette.** A palette validator showed the original Offer (green) and Rejected (red) colours were indistinguishable with red-green colour blindness (ΔE 1.2). The colours were re-picked to ΔE 7.9, and every status is also labelled in text.
- **Code splitting.** Lazy-loading the Insights page cut the initial JavaScript bundle from 804 KB to 436 KB.
- **Timezone-safe dates.** `new Date('2026-11-06')` is parsed as UTC, which in Melbourne (UTC+11) can land on the wrong day. Dates are parsed as local calendar dates, with tests.
- **Untrusted input is validated.** Backup files are checked record by record with Zod before anything reaches the store.
- **Self-hosted fonts.** No runtime requests to third-party font servers.

## Project structure

```
src/
  types/        Data model (Zod schema = types + validation)
  store/        Zustand store, the only place data is read or written
  lib/          Pure logic: dates, insights, backup, sample data (unit tested)
  components/   Board, cards, form, modal, charts
  pages/        Board and Insights screens
```

## Run it locally

Requires Node.js 20.19 or later.

```bash
git clone https://github.com/saichetankari2001/jobtrackr.git
cd jobtrackr
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm test` | Run the test suite once |
| `npm run test:watch` | Re-run tests on every change |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run lint` | Lint with oxlint |

## Roadmap

- [ ] Deploy to AWS: S3 + CloudFront, defined with AWS CDK, deployed by GitHub Actions
- [ ] Sign-in and cloud sync: Cognito, API Gateway, Lambda and DynamoDB
- [ ] Dark mode

## Data and privacy

All data is stored in your browser's localStorage and never sent anywhere. Use **Export backup** to keep a copy or move it to another browser.
