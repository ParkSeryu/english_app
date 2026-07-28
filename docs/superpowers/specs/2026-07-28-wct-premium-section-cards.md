# WCT Premium Section Cards

## Goal

Turn the Premium Day reading body into a clear mobile card view without changing lesson copy, routes, authentication, or behavior.

## Approved design

- Each major section—핵심 내용, 주격과 목적격, 생략 규칙, what과의 차이, 핵심 패턴—is one white rounded card with a slate border and subtle shadow.
- Example blocks remain gray mini cards.
- Rule blocks remain teal emphasis cards.
- List and pattern items use compact gray mini cards inside their section.
- The page header stays outside the cards.

## Scope

Only `WctPremiumDayContent` presentation and its component regression test change. No data model, database, source metadata, navigation, or lesson-copy changes.

## Verification

Use a failing component assertion for all five section cards before implementation. Then run focused tests, lint, typecheck, the WCT Playwright flow, and live route checks.

