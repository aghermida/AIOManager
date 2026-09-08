# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AIOManager is a personal fork of [`Sonicx161/AIOManager`](https://github.com/Sonicx161/AIOManager), a self-hosted "one manager to rule them all" for Stremio (linked accounts, addon library, Autopilot failover, encrypted key vault, Replay sharing). It's a single Node process: a Fastify backend (`server/index.js`, one file) serves both the JSON API and the built Vite/React SPA (`dist/`). The client is Zero-Knowledge — all encryption happens in the browser via Web Crypto (`src/lib/crypto.ts`); the server only ever stores encrypted blobs, in SQLite (`better-sqlite3`, default) or Postgres (`DATABASE_URL` + `DB_TYPE=postgres`), and re-encrypts each blob at rest with its own `ENCRYPTION_KEY`.

This fork is deployed at `aiomanager.sandokan.dev` — see "Deployment" below.

## Commands

- `npm install`
- `npm run dev` — client (Vite) + server (`node --watch`) concurrently
- `npm run client` / `npm run server` — run just one side
- `npm run build` — `tsc && vite build`
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — eslint, `--max-warnings 0`
- `npm run format` — prettier on `src/**/*.{ts,tsx,css,json}`
- `npm run preview` — preview the built SPA

## Architecture

- `src/` — React SPA. State is Zustand, one store per domain: `authStore` (master password → session `CryptoKey`, kept in `sessionStorage` only, never persisted to disk), `syncStore` (claims/reads/writes the account's encrypted blob against `/api/sync/:id`, persisted via zustand `persist` to `localStorage`), `vaultStore` (encrypted API-key vault, locks/unlocks with `authStore`'s key), `accountStore`, `addonStore`, `profileStore`, `failoverStore`.
- `server/index.js` — single-file Fastify server. Key routes: `/api/sync/:id` (GET/POST/DELETE — claim, read, update, delete one account's encrypted blob; auth is just `x-sync-password` matching what was set at claim time — **there is no listing/admin endpoint, no account limit, and no rate limiting by default**), `/api/autopilot/*`, `/api/addon-health`, and proxy endpoints for Stremio/metadata requests. DB access goes through a small driver abstracting SQLite/Postgres.
- Deployment: `/opt/aiomanager` on the VPS, `docker-compose.yml` pulls `ghcr.io/aghermida/aiomanager:latest`, Caddy reverse-proxies `aiomanager.sandokan.dev` → `localhost:1610`, Watchtower pulls/restarts on a 24h interval (`--interval 86400`, no label filter — same as every other container on that host).

## Fork sync conventions (read before touching `.github/workflows/` or deleting/renaming any file)

This repo is a personal fork of [`Sonicx161/AIOManager`](https://github.com/Sonicx161/AIOManager). `.github/workflows/docker.yml` merges `upstream/main` into `main` on every push, daily at 05:00 Europe/Madrid (cron), and on manual dispatch, then pushes the result and builds/publishes `ghcr.io/aghermida/aiomanager:latest`. For this automation to keep working with **zero manual intervention**, the merge must apply cleanly every time — it only ever fails when a fork-only change touches something upstream is still actively evolving on its own.

The sister repos `AIOStreams` and `aiometadata` (same fork-of-upstream setup) hit exactly this: they'd deleted CI workflow files upstream kept modifying, so every nightly/weekly sync produced a `modify/delete` conflict and failed repeatedly until `FORK_DELETED_UPSTREAM_FILES` was introduced (see their `CLAUDE.md`s). Follow the same rules here, for any file:

1. **Never delete, rename, or replace a file that still exists upstream** without registering it. If a file must genuinely diverge (this fork replaces upstream's version outright), add its path to the `FORK_DELETED_UPSTREAM_FILES` array at the top of the "Sync fork with upstream" step in `docker.yml`, with a one-line reason, and let the sync step skip it explicitly during conflict resolution instead of just deleting it and hoping. Currently registered: `.github/workflows/docker-publish.yml` (replaced by `docker.yml`'s own build+push job — required Docker Hub secrets this fork doesn't have).
2. **Fork-only code lives in new files — never edited into the originals — unless it is genuinely impossible to do otherwise.** Code inherited from upstream should stay byte-for-byte identical to `upstream/main`. Any fork-only functionality is implemented in a new, uniquely-named file (e.g. under `src/lib/` or `server/`). Before writing a single line into a file upstream also maintains, the mandatory question is: can this instead live in a new file?
3. **Editing an original file is the last resort, only when there is truly no way to avoid it** (most likely `server/index.js` or a store under `src/store/`, where the only entry point to hook fork-only behavior is a file upstream also owns, with no extension mechanism to do it from outside). When there is genuinely no alternative:
   - Keep the change as small as possible — ideally a single line (a new branch/case, a new optional env var, a new export) that calls into logic living entirely in a new file, never the logic itself.
   - Don't delete or restructure the surrounding code upstream still maintains. Git's line-based merge only conflicts where both sides touch the *same* lines, so a minimal additive edit keeps merging cleanly even as upstream keeps changing the rest of the file.
   - Tag it per rule 6 below so it stays `grep`-able.
4. Treat everything under `.github/workflows/` as upstream-owned by default — assume upstream will keep editing any workflow file it ships, and apply rule 1 there specifically.
5. When merging a PR that contains a `Merge upstream/main into main` commit (or otherwise carries upstream's history), always use a real merge commit — **never squash**. Squashing breaks the shared history with upstream and causes the *next* sync to fail for an unrelated reason (a fresh merge-base mismatch).
6. **Mark any fork-only code that must stay inside a shared file with a `// [FORK-9xxxx]` comment**, using the next free ID from this list (sequential, starting at 90000):
   - `90001` — single-account limit on registration: logic lives in `server/fork-single-account-limit.js` (`rejectIfSingleAccountLimitReached`); hooked with a two-line call (import + guard) from `server/index.js`'s `POST /api/sync/:id` handler. Once one account exists in `kv_store`, claiming a *new* id is rejected (updates to the existing id still work).

   Next free ID: `90002`. This makes every fork-owned line inside a shared file `grep`-able (`grep -rn "FORK-9" .`) regardless of how the surrounding upstream code changes.
7. **IMPERATIVE — no exceptions:** whenever rule 3 applies to a shared *list* (an import block, a `switch`/`case`, a registration array, an object literal used as a lookup table), the fork-only entry MUST be appended after the *last* existing item — never inserted in the middle or interleaved alphabetically/thematically with upstream's own entries, even when that looks tidier. Appending after everything upstream currently has minimizes how often a purely-additive insertion still collides with an upstream edit to a nearby line; if upstream also only ever appends at the tail, concurrent tail-appends from both sides typically merge with no conflict at all. Before adding any fork-only entry to any shared list, check its current last position first.
8. When `docker.yml`'s sync step fails with a real `CONFLICT (content)`, resolve it by hand in a PR (never push a resolution straight to `main`): fetch `upstream/main`, merge it into a branch, and for each conflicted file keep both sides' changes (per rule 3) rather than picking one. **After resolving, run `npm run typecheck` and `npm run build` before pushing** — git's line-based merge can silently drop one side's addition with no conflict marker at all when it sits right next to a hunk the other side touched.
9. **Commit as the GitHub noreply email**, not a real address: `<github-user-id>+<username>@users.noreply.github.com` (look up the id with `gh api user --jq .id` if unknown). This repo's owner has GitHub's email-privacy push protection enabled, so a commit authored with a real email gets rejected on push (`GH007`). Set the commit's author/committer explicitly (`git commit --author=...` plus `GIT_COMMITTER_EMAIL=...`) — never change the global/local git config to do this.

## Required checklist when removing or restructuring fork-only code

1. **Verify a suspicious line's origin with `git log -S'<snippet>' -- <file>` before removing it** — confirm it was introduced by the commit that added the fork-only feature being removed, not for an unrelated reason that happens to share the line.
2. **Split the work into separate, self-contained commits** — one per logical concern — so a review comment or CI failure on one doesn't block the rest, and each commit is independently revertable.
3. **Before calling it done, trial-merge against the live `upstream/main`**: `git fetch upstream main && git merge-tree --write-tree HEAD upstream/main`. A clean diff against a stale local snapshot is not the same as a clean merge — always re-fetch first.
4. **After deploying, verify live** on `https://aiomanager.sandokan.dev`, at minimum: the login/register screen renders, and any fork-only behavior (e.g. the single-account limit) still does what it's supposed to. Don't rely on `npm run build`/lint alone to catch a runtime regression.
