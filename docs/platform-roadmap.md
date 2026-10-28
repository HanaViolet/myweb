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

## Interaction follow-up (local next version)

- Detail opacity, input readiness and focus share one monotonic presentation signal. Foreground frame time bounds a stalled reveal; changing records cannot hide already-readable content.
- Applying a service-worker update saves the active record, reading tab and scroll position in session storage. A matching checkpoint expires after ten minutes. Restoration waits for the body; deliberate user input cancels pending restoration.
- Gallery images have loading/error feedback and touch swipe navigation. Small-screen controls have 44px minimum height, and reduced motion disables the image fade.
- Pure regression checks cover presentation timing and checkpoint validation. Full service-worker upgrade restoration and touch gestures still require device/end-to-end validation. Late-loading media can affect restored scroll position.

## Next milestones (not represented as completed)

1. Responsive image variants and local media ingestion; virtualized search for large collections.
2. Broader scene/readiness integration, animation stress tests on real mobile devices, and end-to-end update restoration checks.
3. Album/playlist editing, travel timeline UI, cross-content collections and optional content-management UI.
4. Operational monitoring, deployment rollback exercise and accessibility/device performance budgets.

The 3D core remains intentionally unchanged in this pass. PWA status text is now an adapted file in the upstream provenance manifest because lazy content changes the offline guarantee.
