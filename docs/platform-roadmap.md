# Personal content platform

## Implemented foundation

- Visual X-numbers remain unchanged. Favorites use `content:<permalink>` identities and migrate from the old numbering without cascading remaps.
- Runtime catalog contains metadata and heading summaries. Immutable `/content/<hash>.json` bodies load on demand with retry, and the full-text index loads when opening search.
- Prerendered HTML continues to contain complete content for direct reading and indexing. Visited JSON bodies are cached by the service worker.
- Search preserves query, category, sort and list position during a session. Reading tabs retain mounted content, comments and independent scroll positions within a record.
- Search and detail paging share a navigation path; Escape works from prose controls.
- Gallery viewer supports previous/next, original image and keyboard navigation. The music player exposes its queue.

## Travel journals

Create a Markdown file in `source/_trips/`. Required front matter:

```yaml
title: 旅行标题
slug: my-trip
date: '2026-10-28'
destination: 地点
published: false
tags: [旅行]
related: [/gallery/]
```

Set `published: true` when ready. Use existing absolute media paths or HTTPS URLs. `slug` is the permanent address under `/travel/`; do not change published slugs. Travel journals use the article lane. Related routes must exist. Drafts and future travel dates are excluded.

Run `npm run check` before publishing. It includes original content/link checks and new platform contracts. Keep source files, `content/blog-ids.json` and media backed up together. Generated directories can be rebuilt. Preview a production build with `npm run preview`; deployment remains the existing Cloudflare workflow.

## Next milestones (not represented as completed)

1. Responsive image variants and local media ingestion; virtualized search for large collections.
2. A unified scene/readiness state machine, animation stress tests on real mobile devices, and update-position restoration.
3. Album/playlist editing, travel timeline UI, cross-content collections and optional content-management UI.
4. Operational monitoring, deployment rollback exercise and accessibility/device performance budgets.

The 3D core remains intentionally unchanged in this pass. PWA status text is now an adapted file in the upstream provenance manifest because lazy content changes the offline guarantee.
