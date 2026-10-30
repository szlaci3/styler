# M13 — Richer coherent sample website

Completed 2026-10-30 (Europe/Brussels). The user's “Next” instruction selected the documented next milestone, M13, after M12 acceptance.

## Working behavior

Form & Field remains the same fictional workspace website, now expanded with:

- Navigation to spaces, membership, and visit sections, using the preview's own scroll container and reduced-motion preference.
- Two original local SVG studio illustrations rendered as real images with fixed content, alt text, intrinsic dimensions, and styleable frames.
- Existing space cards and expandable details, plus an amenities/story section and a member quote.
- Three selectable membership options using native accessible radio controls. Selection has a clear visual outline and feeds the local visit summary.
- A visit form with required name, workspace and weekday dropdowns, optional notes, native validation, and a local confirmation. Editing details or membership clears stale confirmation. No booking, payment, email, or network submission occurs.
- Native keyboard-operable FAQ disclosures.
- Existing quiet-hours switch and newsletter interaction, both preserved.

All website content, image sources, selections, form values, confirmation, open FAQ, and original preview DOM survive style switching. Image/heading appearance and form controls change with the selected style and live locks.

## Styling decisions

New components reuse existing button, card, copy, input, and details groups. The input group covers text inputs, dropdowns, and textarea consistently. Native radio controls remain layout-owned controls with selected/focus states.

Two additive bounded selector IDs, subheading and image, cover section-heading typography and illustration-frame radii/borders. Every preset supplies validated declarations for them; the inspector and provider output schema discover the added vocabulary automatically. Existing IDs/source order remain unchanged. Older sparse style definitions without the new optional rules remain structurally valid. No arbitrary properties, selectors, raw CSS, image URLs, custom authoring, or new runtime dependencies were added.

Original SVG assets live in public/images/quiet-studio.svg and common-table.svg; they have no scripts, remote references, embedded external assets, or external font dependencies. Image content remains fixed across styles; only its CSS frame is styleable. The old decorative CSS card drawings were removed after replacement.

## Verification

- npm test: **18 offline tests passed**.
- npm run build: **passed**, including TypeScript and production frontend compilation. Both local illustrations are included in dist/images/.
- npm run test:e2e: **28 Edge checks passed** on isolated port 5174, including all 24 existing MVP checks and four new M13 checks.
- New checks exercise all seven presets at **1280×720, 1440×900, and 1920×900**, checking retained content/control values/confirmation/FAQ, unchanged image sources and mounted dropdown, image decoding, style coverage, horizontal bounds, local navigation, and no AI/external requests.
- Additional browser check verifies shared locks and Unset across new dropdown/textarea/image/heading surfaces, required-field validation, keyboard dropdown interaction/submission, and confirmation reset after editing.
- Initial image assertion found missing explicit SVG intrinsic dimensions; both assets now declare width/height, and image loading checks pass.
- Visual QA inspected the After Hours visit form at 1280px and the Monograph illustrated space cards at 1440px. Current screenshots are in ignored test-results/m13-*.png.
- Final source/public-assets/documentation/build scan passed for credential leakage and trailing whitespace. Browser build contains no GEMINI_API_KEY variable name. git diff --check passed; untracked files were explicitly scanned.

## Boundary and remaining work

M1–M13 complete. Generation still produces exactly two results and is manual only. Inspiration selection, six-slot batching, automatic countdown, and active-generation timer coordination were not implemented. M14 — exclusive inspiration selection — is the next recommended milestone and is not started.

No paid provider request, provider substitution, deployment, commit, or push occurred in M13. Real-provider evidence remains the earlier two completed M11 results; the expanded selector vocabulary has offline/browser validation but no new real-provider sample. Hosting, sustained/provider concurrency performance, and cost remain unverified. No mobile work, persistence/database, or V2 CSS authoring was added.
