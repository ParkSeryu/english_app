# WCT Premium Design Alignment

## Goal

Make the WCT Premium shelf card, Day list, and Day detail use the same visual language as the existing WCT library while preserving the approved Premium lesson content, routes, authentication, and read-only behavior.

## Approved direction

The user approved matching the existing WCT Day design and keeping `WCT Premium` only as the product label. The fix must not redesign the surrounding app or alter lesson copy.

## Approaches considered

1. **Restyle the existing Premium components (selected).** Reuse the existing WCT class patterns—white slate-bordered cards, teal accents, slate examples, and teal concept/rule blocks—without changing the Premium content model.
2. Convert Premium lessons into `WctDay` records and render `WctDayContent`. Rejected because this would invent source metadata and source badges that Premium explicitly does not use.
3. Extract a new shared card design system. Rejected as unnecessary refactoring for a focused visual regression.

## Design

- `WctPremiumCard` matches `WctBookCard`: white background, slate border, teal label and hover, with a `Day 1개` summary.
- `WctPremiumDayCard` matches `WctDayCard`: white background, slate border, teal hover, compact Day label. The lesson title remains on the detail screen.
- Premium list and detail headers use the same teal WCT accent as the existing WCT pages. `WCT Premium` remains the identifying label.
- Premium paragraphs remain plain reading text.
- Premium example blocks use the existing WCT example treatment: slate-50 rounded cards with dark text, never black code panels.
- Premium rule blocks use the existing core-concept treatment: teal-50 cards with slate text, never violet panels.
- Premium list blocks keep the existing WCT practice treatment: slate-100 rounded rows.
- Premium patterns use the existing WCT pattern-card shell: white, slate border, rounded-3xl, shadow-sm.

## Non-goals

- No lesson copy, route, auth, database, schema, or source metadata changes.
- No new dependency or generalized design abstraction.
- No edits to unrelated navigation or WCT book content.

## Verification

- Add component regression assertions for shared WCT card and content classes, first observed failing against the current violet/black implementation.
- Run the focused WCT component test, full test suite, lint, typecheck, production build, WCT Playwright flow, and live Premium Day 1 checks on dev and main.

