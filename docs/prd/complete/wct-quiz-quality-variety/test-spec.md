# WCT Quiz Quality and Variety Test Specification

| Surface | Verification |
| --- | --- |
| Shared validation | v1 remains dual-readable without materializing optional fields; v2 requires valid format-specific choice counts, feedback, kinds, and generator version. |
| Source and provenance | Correct answers and evidence come only from approved, non-review-pending target-Day patterns and examples; source hashes are deterministic. |
| Controlled mutations | Each wrong choice changes exactly one declared target under one grammar-rule family; unsafe candidates fail closed. |
| Five-slot composition | Every v2 Day has five deterministic questions, 2 `multiple_choice`, 2 `fill_blank`, 1 `true_false`, 3 translation, 2 pattern, and no adjacent equal formats. |
| O/X balances | Prenovice has exactly 8 O / 8 X and Novice exactly 14 O / 14 X; each Pop attempt's O/X subset differs by at most one. |
| Overrides | A full-Day override requires its matching normalized source hash and independently passes the same v2 validation. |
| 44/220 audit | The complete 16+28 inventory produces 44 audited v2 sets and 220 questions, plus a reviewed deterministic artifact and approval manifest. |
| Memory/Supabase sync | Standard batch replacement is idempotent for matching version/hash, fails on integrity collisions, and is all-or-nothing. |
| Progress reset | Replacing target standard sets deletes their Day progress and targeted Prenovice/Novice Pop progress, while preserving Premium and every non-allowlisted source row/field. |
| v1/Premium compatibility | Raw v1 question JSON and snapshots stay parseable and unmodified; Premium remains `wct-review-v1` and continues to score. |
| Pop selection and retakes | v2 first attempts use balanced schedules; retakes rotate formats and change the question ID for every one of 16 or 28 Days; mixed inventories fail closed. |
| UI feedback timing | Choices lock after selection; Day/topic remains hidden until confirmation; v2 feedback shows correct sentence, pattern, and reason afterward. |
| RLS/RPC | Owner-only reads, anonymous/non-owner denial, browser direct-write denial, and service-role-only batch synchronization pass. |
| Source transition | A sorted eight-entry manifest binds exact book/Day/pattern/example parents, old/new English and Korean, one changed text field per entry, and pre/post source hashes; audit projects it read-only in memory. |
| Migration rollback | Wrong source parent/preimage, inventory, payload, or postcondition failures roll back all eight source edits, the full production replacement, and every progress deletion. |
| Mobile E2E | Mobile Chromium completes a three-format standard quiz and both 16-question and 28-question Pop flows, including refresh/resume and retake rotation. |
| Local routes | The built app on `0.0.0.0` serves affected standard and Pop routes over localhost and reachable machine IP without fatal server errors. |
| Production readback | Main/production readback confirms the exact eight-field source delta with intact UTF-8, 44 v2 payloads, semantic JSON/hash equality, pre/post source hashes, and cleared targeted progress. |
| Deployed smoke | Authenticated production routes show v2 feedback, correct attempt totals, and an immediate question-1 remount on same-route retake after checkpoint B. |

All specification rows passed before lifecycle closure on 2026-08-06. The
approved production smoke residue was removed afterward and the complete
inventory/source/Premium snapshot was revalidated unchanged.
