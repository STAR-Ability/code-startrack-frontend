# Code Startrack Frontend Tech Stack

## Runtime

- Node.js LTS

## Package Manager

- pnpm
- `pnpm-lock.yaml` 必须提交到仓库
- 团队统一 pnpm 版本

## Framework

- Next.js
- React
- TypeScript
- App Router

## UI

- Tailwind CSS
- shadcn/ui
- Lucide React

## Data

- TanStack Query
- Zod

## Forms

- React Hook Form

## Charts

- Apache ECharts

## Testing

- Vitest
- Playwright

## Code Quality

- ESLint
- Prettier
- TypeScript Strict

## AI Development

- Codex
- AGENTS.md
- shadcn MCP

## Continuous Integration

- GitHub Actions

Every Pull Request must automatically run:

1. Dependency installation
2. ESLint
3. Prettier check
4. TypeScript type check
5. Vitest unit tests
6. Next.js production build
7. Playwright E2E tests where required

A Pull Request must not be merged if required CI checks fail.

## Containerization

- Docker
- Multi-stage Docker Build
- `.dockerignore`

## Container Registry

- GitHub Container Registry (GHCR)

Images should be tagged using:

- Git commit SHA
- Release version
- `latest` only for convenience, not as the sole production version

Example:

ghcr.io/star-ability/code-startrack-frontend:v0.1.0

ghcr.io/star-ability/code-startrack-frontend:sha-a1b2c3d

## Deployment / CD

- GitHub Actions
- Docker
- GHCR

Recommended flow:

main / release tag
→ GitHub Actions
→ Build Docker Image
→ Push to GHCR
→ Production Server
→ docker compose pull
→ docker compose up -d