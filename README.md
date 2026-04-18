# AuthorVault

A centralized book asset management platform for authors. Manage your entire catalog, track publishing platforms, organize files, and handle marketing assets — all in one place.

## Tech Stack

- **Frontend** — Angular 21, TypeScript 5.9, RxJS
- **Backend** — (in progress)
- **Styling** — Custom CSS with CSS variables, responsive design

## Project Structure

```
project/
├── frontend/          # Angular application
│   ├── src/
│   │   └── app/
│   │       ├── components/
│   │       │   ├── layout/       # Sidebar, Header
│   │       │   ├── pages/        # Dashboard, Books, Book Detail, Settings, Login, Signup
│   │       │   └── shared/       # Toast, etc.
│   │       ├── models/           # TypeScript interfaces (Book, BookFile, etc.)
│   │       └── services/         # BookService, AuthService, ThemeService, etc.
│   └── reference file/           # UI reference components
└── backend/           # API server (in progress)
```

## Features

- **Books Catalog** — List, grid, and table views with search and status filtering
- **Book Detail** — Files, metadata, platform versions, marketing assets, version history
- **Dashboard** — Stats overview with published/draft counts and asset totals
- **Settings** — User preferences and theme configuration
- **Auth** — Login and signup flows

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+

### Install & Run

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:4200`

### Build

```bash
npm run build
```

Output goes to `dist/`.

## Routes

| Path | Page |
|------|------|
| `/login` | Login |
| `/signup` | Sign Up |
| `/dashboard` | Dashboard |
| `/books` | Books catalog |
| `/books/:id` | Book detail |
| `/settings` | Settings |
