# MyMovieList — Traditional Version

A full-stack movie tracking web application built with **Next.js 15**, **React 19**, and **Supabase**. Users can browse movies, write reviews, create lists, rate films, manage a watchlist, and receive recommendations.

This is the **traditional version** — developed with minimal AI assistance, focusing on manual implementation and conventional software engineering practices. An [AI-assisted version](https://github.com/FranciscoPereira474/myMovieList-AI) was built in parallel for comparison.

> Academic project for the **Automated Software Engineering (ADS)** course — Master's in Computer Engineering, University of Coimbra, 2025/2026.

## Features

- Browse and search movies with filters (genre, year, rating, actors)
- Movie detail pages with cast, ratings, and reviews
- User authentication (email/password, Google OAuth via Supabase)
- Write, edit, and delete reviews with star ratings
- Comment on reviews
- Create and manage custom movie lists
- Personal watchlist and user ratings
- Movie recommendations
- Responsive design

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Frontend | React 19, Tailwind CSS, Material UI |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + Auth) |
| Containerization | Docker (multi-stage builds) |
| CI/CD | GitLab CI/CD |
| Deployment | Google Cloud Run |
| Registry | Docker Hub (dev/staging), GCP Artifact Registry (prod) |

## CI/CD Pipeline

The GitLab CI pipeline implements a 4-stage workflow across three environments:

```
BUILD → TEST → PUSH → DEPLOY
```

| Environment | Branch | Deployment |
|-------------|--------|------------|
| Development | `dev` | Automatic |
| Staging | `staging` | Automatic |
| Production | `main` | Manual (canary) |

### Canary Deployment

Production uses a canary deployment pattern with Google Cloud Run's traffic splitting:

1. Deploy new version with **10% traffic** (manual trigger)
2. Run automated health checks (10 checks, 3s apart)
3. If checks pass → promote to **100% traffic** (manual trigger)
4. If checks fail → **automatic rollback** to previous revision

## Project Structure

```
project-ads-mei-main/
├── DEV/
│   └── mymovielist/       # Next.js application source
│       ├── app/           # App Router pages and components
│       ├── lib/           # Supabase client, utilities
│       └── public/        # Static assets
├── DOC/                   # Project documentation & LaTeX report
├── REQ/                   # Requirements documentation
├── TESTS/                 # Test documentation
├── ARCH/                  # Architecture (DB schemas, recommendation API)
├── .gitlab-ci.yml         # CI/CD pipeline
└── Dockerfile             # Multi-stage Docker build
```

## Getting Started

```bash
cd DEV/mymovielist
npm install
cp .env.example .env.local   # Fill in your credentials
npm run dev                  # http://localhost:3000
```

### Environment Variables

Create `.env.local` in `DEV/mymovielist/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your-url \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -t mymovielist .

docker run -p 3000:3000 mymovielist
```

## Team

Developed by a team of 6 MSc students in Computer Engineering (MEI) at the University of Coimbra:

- Bruno Vilas-Boas
- Francisco Loureiro
- Francisco Pereira
- Gonçalo Borges
- Lucas Caetano
- Tiago Mendes

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
