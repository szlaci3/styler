# Styler — Product Specification and Development Instructions

## 1. Assignment

Build a React/TypeScript web application that allows users to explore, generate, compare, and refine visual styles for a sample website.

The application combines:

- Curated predefined styles.
- AI-generated styles.
- Locally randomized styles.
- CSS declaration-level controls.
- Smooth transitions between visual styles.
- A progressively growing history of generated styles.

The central experience is interactive visual experimentation. Users can select styles, lock preferred CSS values, and generate new visual variations based on their constraints.

This is a **website style explorer**, not a general-purpose website builder.

### AI execution system

Use the **Antigravity Agentic execution system**, specifically:

`antigravity-preview-09-2026`

This is an explicit product requirement. Do not silently substitute a conventional Gemini model or another provider.

Treat Antigravity as the requested agentic execution system rather than assuming it is interchangeable with an ordinary Gemini text-generation endpoint.

Verify the actual API interface, authentication requirements, response format, and available execution capabilities before implementing integration.

I have access credentials for the intended system. If additional API details or credentials are required, request them.

Do not create an alternative model integration or automatic fallback mechanism. If the specified integration cannot be used, report the blocker and obtain my decision.

### Development approach

**Start in Plan mode. Do not begin substantial implementation until I approve the roadmap.**

You may ask **up to seven questions upfront** if their answers materially affect the product specification or architecture.

Ask these questions together in one numbered batch, preferably with recommended defaults.

Do not spend questions on routine implementation decisions you can make yourself.

You are responsible for architecture, technical decisions, code organization, dependencies, testing, and implementation details within the approved scope.

---

## 2. Release scope

The project has three distinct levels.

### MVP

A functional desktop styler with:

- Four-column layout.
- A simple but representative website preview.
- Several predefined styles.
- Generated styles history.
- CSS declaration inspection.
- Free, Locked, and Unset declaration states.
- Live CSS overrides.
- Smooth visual transitions.
- One local Jolly Joker style per generation.
- One quick Antigravity-generated style per generation.
- Loading states and automatic scrolling to new results.
- **Manual Generate button only. No automatic generation timer.**

The MVP should be usable as a complete experimental prototype.

### V1

Extend the MVP with:

- A richer, more complete sample website.
- One exclusive inspiration-style lock across both style columns.
- Six results per generation instead of two.
- One local Joker, one quick AI result, and four additional AI results.
- An eight-second automatic generation countdown triggered by changes to CSS constraints or the inspiration lock.
- Progressive delivery of generated results.

### V2

Introduce the ability to manually add CSS properties and values to existing classes.

Newly added properties are locked by default.

The lifecycle of these custom declarations is deliberately deferred for a later product decision.

**Do not implement V2 during MVP or V1.**

---

## 3. Overall layout

The application has four horizontal desktop columns, from left to right.

| Column | Preferred width |
|---|---:|
| Main website preview | 60% |
| Predefined styles | 7% |
| Generated styles | 7% |
| CSS inspector | 26% |

These proportions are the intended starting point, **not rigid constraints**.

You have freedom to adjust them when necessary for usability, legibility, or practical layout behavior.

Preserve the core hierarchy: a dominant main preview, two narrow style-selection columns, and a wider CSS inspector.

### Desktop focus

This project is desktop-focused.

Do not invest development time in ensuring a proper mobile experience, mobile-specific layouts, or mobile navigation patterns.

Responsive optimization is not a requirement for MVP or V1.

Maintain reasonable layout integrity on the intended desktop viewport.

### Scrolling

The predefined styles, generated styles, and CSS inspector columns should scroll independently.

The main preview can scroll independently if its content requires it.

Avoid making the whole application scroll merely because one control column contains many items.

The Generate button belongs at the bottom of the CSS column and should remain visible while CSS declarations scroll.

---

## 4. Main website preview

The main column displays the same HTML-based website throughout the styling process.

Selecting another style changes its presentation, not its underlying content.

### MVP

Create a small, representative page containing elements such as:

- Heading.
- Paragraphs.
- Buttons.
- Toggle or switch.
- Text input.
- Cards or containers.
- Other simple UI elements useful for demonstrating CSS variations.

The goal is to provide enough visual diversity to test colors, typography, spacing, backgrounds, shadows, borders, and radii.

### V1

Expand the page into a visually coherent, relatively complete sample website.

It should contain a useful selection of typical website components, including navigation, text, cards, images, form elements, dropdowns, buttons, and other interactive elements.

The website should look credible as a complete design rather than an arbitrary collection of controls.

Keep its content stable when switching styles.

### Style transitions

Smooth CSS transitions are an essential product feature.

When the selected style changes, animate suitable properties wherever practical:

- Text colors.
- Background colors.
- Border colors.
- Border widths.
- Border radii.
- Shadows.
- Padding.
- Spacing.
- Other interpolable CSS properties.

For example, a button changing from red to white should gradually change color. Rounded corners should smoothly transition between supported radius values.

Avoid remounting or reconstructing the website when a CSS change is sufficient.

Choose reasonable transition durations.

Support reduced-motion preferences.

Do not force transitions for properties that cannot be interpolated meaningfully.

---

## 5. Predefined styles column

Provide several visually distinct curated styles, identified as S1, S2, S3, etc.

Around seven predefined styles is a reasonable initial target, but the actual number may vary.

The column is narrow and independently scrollable.

### Style cards

Each style should be represented by a small visual sample.

A simple card can contain:

- An outer div/box with the style's background and border treatment.
- An inner button labeled S1, S2, etc., using the style's corresponding button appearance.

This allows users to recognize colors and shapes without needing full-page thumbnails.

A card should communicate the appearance of its style, not merely its identifier.

### Selecting a style

Clicking the card applies its style to the main preview.

The website transitions smoothly to the new appearance.

Indicate the active preview style with a clearly visible border, potentially gold-colored.

### Locking a style as inspiration — V1

Add a separate small radio-like control to each style card.

This allows a style to become the inspiration for future AI generation.

The preview selection and inspiration selection are independent.

For example, the user may:

- Lock S3 as inspiration.
- Select G7 for preview.
- See G7 in the main preview, combined with any locked CSS declarations.
- Generate new variations inspired by S3.

Only one inspiration card may be locked at a time, regardless of which column contains it.

Locking another card releases the previous inspiration selection.

Provide a way to clear the inspiration selection entirely.

Inspiration locking belongs to V1; it is not required for the MVP.

---

## 6. Generated styles column

The generated styles column contains compact visual style cards similar to the predefined cards.

Cards are labeled G1, G2, G3, etc.

Each should visually represent its corresponding style.

Clicking one applies it to the main preview.

The column is independently scrollable and grows with successive generations.

### Initial state

Avoid presenting a completely empty generated column.

One possible solution is to include an initial seeded style, visually presented like a generated card.

A seeded style should not be falsely represented as an actual AI response.

You may choose another simple initial presentation if it improves usability.

Do not automatically send an AI request on initial page load.

### Generation history

Each generation appends new cards below existing ones.

Do not replace previously generated styles.

The history should remain browsable as it grows, ideally supporting an indefinite sequence of generations.

For MVP, in-memory session history is sufficient.

Do not add persistent backend storage without a demonstrated need.

### Loading placeholders and automatic scrolling

When generation starts:

1. Append the new card positions immediately.
2. Show loading placeholders for results still being generated.
3. Automatically scroll the generated column toward the new batch.
4. Ensure the new batch is visibly brought into view.
5. Replace placeholders progressively as results arrive.

This automatic scrolling is mandatory for every generation action.

It should occur even if the user was previously browsing older generations.

The goal is to make generation visibly apparent immediately.

Use smooth scrolling rather than abrupt jumps.

For batches taller than the available viewport, ensure at least the start of the new batch and its loading state are clearly visible.

Do not scroll the entire page if scrolling the generated styles column is sufficient.

Do not automatically select new styles for the main preview without an explicit product decision. For now, users select the styles they want to inspect.

---

## 7. Generation — MVP

Every manual Generate action creates exactly two new style cards.

### Result 1: Local Jolly Joker

The first style is created locally without calling Antigravity.

It is called the **Jolly Joker**.

Generate randomized styling values such as:

- Text and background colors.
- Button colors.
- Border radii.
- Borders.
- Spacing.
- Typography.
- Shadows.

The Joker should be adventurous rather than always conservative or aesthetically polished.

Unusual color combinations or awkward visual relationships are acceptable. Some results may be deliberately surprising.

However, the surrounding application interface must remain usable.

The Joker must respect all locked CSS constraints.

Use the same structured style representation as predefined and AI-generated styles.

A reproducible random seed is desirable.

### Result 2: Quick Antigravity generation

The second result comes from the specified Antigravity execution system.

Generate one visually coherent and aesthetically useful style based on the preview website and active constraints.

Use a structured response format that the application can validate and safely apply.

Prefer a fast execution strategy with minimal unnecessary overhead.

### Generation sequence

When the user clicks Generate:

1. Capture an immutable snapshot of the active CSS constraints.
2. Append two card slots to the generated styles column.
3. Produce the Joker locally and display it immediately.
4. Show a loading placeholder for the Antigravity-generated style.
5. Automatically scroll to the new batch.
6. Start the Antigravity request using the same constraint snapshot.
7. Replace the loading placeholder when the validated result arrives.

The Joker must not wait for the AI request.

### MVP Generate button

**The MVP has manual generation only.**

The button simply says `Generate` when available and `Generating…` while a request is active.

No automatic countdown is required.

Changing a CSS lock, unsetting a property, selecting another style, or performing any other interaction must not automatically trigger generation.

There is no eight-second timer in the MVP.

The Generate button should remain usable even when there are no active constraints.

A generation without constraints should explore new visual directions rather than return an empty or meaningless result.

Do not trigger generation automatically when the application first loads.

### API observability

Measure or record useful information where practical:

- Generation latency.
- Request success or failure.
- Token usage where exposed.
- Approximate execution cost where measurable.
- Result validity.

Use this information to evaluate the practicality of increasing the number of AI-generated styles in V1.

Do not create an elaborate analytics system for this.

---

## 8. Generation — V1

Each generation action produces six style cards:

1. One local Jolly Joker.
2. One quick Antigravity result.
3. Four additional Antigravity results.

Follow-on decision (2026-10-31): the quick AI slot uses the **Professional** expression; the next four use **Playful**, **Mysterious**, **Commercial**, and **Artistic**, in that order. Show these expressions in placeholders and completed card labels alongside Joker. Each expression guides a complete coordinated design within captured inspiration and CSS constraints. Retain its expression on manual retry. Delivery remains progressive with bounded concurrency; the Professional slot is not guaranteed to finish first. Similar outputs remain acceptable without mandatory deduplication or regeneration.

Temporary reliability decision (2026-10-31, supersedes the active count above): enable only **Joker and Professional**. Keep the four other expression definitions for later re-enabling, but create no slots or requests for them and reject disabled expressions at the server. Existing accepted history remains browsable. All inspiration, lock/Unset, countdown and manual-retry behavior remains; retry cannot start a disabled expression.

Subsequent reliability investigation (2026-10-31, supersedes the temporary count): restore **Joker plus all five AI expressions**. The user authorizes live experiments with prompt size, requested output size, token budget, concurrency and pacing to improve completed, validated Antigravity responses and document observed limits. Preserve the exact agent, captured constraints, manual retry and progressive delivery. Measurements and the selected operating profile belong in `antigravity-reliability.md`; finite samples do not guarantee provider availability.

Latest batch decision (2026-10-31, supersedes the counts above): append **six cards** in order: **Joker**, **Harlequin**, quick AI **Professional**, then **Playful**, **Commercial**, and **Artistic**. Joker remains local with ±20 per RGB channel; Harlequin is a second independent seeded local result using the same algorithm with ±40. Both preserve alpha, inspiration/G1 per-declaration fallback, shadows, source immutability and authoritative locks/Unset. Both local cards appear without waiting for AI. Mysterious is disabled for new requests and retries; existing accepted history remains selectable. Keep the original shared snapshot, two AI lanes, countdown, independent selection, progressive delivery and rail scroll behavior.

The Joker should appear essentially immediately.

The quick AI result should ideally arrive before the four additional styles.

The remaining results appear progressively as they become available.

Use six card positions from the start of each generation and replace individual loading placeholders when their results arrive.

### Speed and diversity

Favor fast, responsive generation.

The first AI result and the subsequent four results may be generated independently or concurrently.

Do not introduce a sequential dependency merely to guarantee different results.

**I explicitly accept the tradeoff that the quick generation and one or more of the subsequent AI generations may be identical or very similar.**

This is acceptable behavior.

Do not implement mandatory deduplication or regeneration of similar results.

Do not require the first generated style to be sent back to Antigravity before starting the remaining four.

You may encourage diversity through inexpensive prompt instructions or other low-overhead approaches, but strict uniqueness is not a requirement.

All results must respect the same active constraint snapshot.

Choose appropriate batching, concurrency, and execution settings based on actual performance and cost measurements.

The architecture should allow the generation count and stages to change without restructuring the application.

---

## 9. CSS inspector

The fourth column displays CSS-like declarations grouped by selectors/classes.

For example:

```css
.button {
  color: white;
  background-color: blue;
  border-radius: 12px;
}

.card {
  background-color: #f5f5f5;
  padding: 20px;
}
```

The interface should be familiar to frontend developers.

Display selectors, property names, and values clearly.

Prefer showing property values immediately rather than retrieving them only on hover.

There is no reason to optimize this prematurely if the values are already in application state.

### Three mutually exclusive declaration states

Each CSS declaration supports three states:

**Free**

- The default state.
- The property follows the currently selected style.
- It imposes no constraint on future generation.

**Locked**

- Captures the property's current effective value.
- Preserves that value until unlocked.
- Applies the value as a live override in the main preview.
- Sends the value as a constraint for future generation.

**Unset**

- Removes any existing lock on the property.
- Instructs future generation not to explicitly specify that declaration.
- Allows the resulting CSS cascade or default behavior to determine its value.
- Does not immediately impose the literal CSS keyword `unset` on the main preview.

The product's Unset operation should not be confused with the exact semantics of the CSS `unset` keyword.

### Declaration controls

Use two small controls per CSS declaration:

- Lock.
- Unset.

They should behave like mutually exclusive toggle buttons.

Neither selected means Free.

Clicking an active Lock again returns the property to Free.

Clicking an active Unset again returns it to Free.

Clicking Unset while Locked clears the lock and activates Unset.

Clicking Lock while Unset clears Unset and captures the current effective value.

Provide accessible labels and clear visual states.

Do not require a third explicit Free button.

### Multiple locks

Users can lock any number of CSS declarations.

For example:

```css
.button {
  background-color: red; /* Locked */
  border-radius: 16px;    /* Locked */
}

.card {
  padding: 24px;          /* Locked */
}
```

These constraints remain active until the user changes them.

### CSS cascade

Use normal CSS precedence principles.

The literal stylesheet/source order matters.

The order in which the user clicked Lock controls does not determine CSS precedence.

Respect specificity, cascade layers, importance, and inheritance where relevant.

For declarations with otherwise equal precedence, the later declaration in stylesheet order wins.

Explicit CSS locks must take priority over the original style values they are intended to constrain.

Favor a straightforward technically correct approach rather than building an unnecessary custom CSS engine.

---

## 10. Live CSS overrides

Locked CSS declarations immediately affect the main preview.

This is required in the MVP, not just V1.

Consider:

1. S1 gives a button a red background.
2. The user locks the background-color declaration.
3. The user switches to G3, which normally uses blue.
4. The button remains red because the CSS declaration is locked.
5. Other unlocked properties transition to G3's values.

Therefore:

**Effective preview = selected style + locked CSS overrides.**

The lock remains active across all subsequent style selections until explicitly removed.

Switching a declaration to Free or Unset removes its live override, allowing the selected style to determine the preview value again.

### Inspector values

The CSS inspector displays effective values.

When a declaration is locked, show the locked value.

Do not additionally display the selected style's original overridden value as faded text, secondary metadata, or explanatory UI.

We explicitly decided not to show those secondary values.

Keep original style data intact internally.

### Original style integrity

Do not mutate a predefined or generated style merely because a user locks a CSS declaration.

Live overrides are separate state.

Unlocking restores the behavior of the underlying selected style.

### Interaction with generation

Both the local Joker and Antigravity must respect the locked declarations.

The same resolved constraints should be passed into the generation process regardless of whether a style comes from local randomization or AI.

---

## 11. Inspiration locking — V1

Users may lock exactly one style card as inspiration across the predefined and generated columns.

The inspiration lock is independent of which style is currently selected for preview.

The system therefore maintains three concepts:

1. Active preview style.
2. Locked inspiration style.
3. Locked or unset CSS declarations.

For example:

- S2 is locked as inspiration.
- G5 is selected for preview.
- Three CSS declarations are locked.

The current preview displays G5 plus the three locked CSS overrides.

Future generations are inspired by S2 while respecting all three CSS constraints.

### Priority

Explicit CSS locks take priority over inspiration-style values.

Where conflicts exist, the locked declarations win.

The inspiration style guides the remaining free visual choices.

Only one inspiration card can be locked at a time, but multiple CSS declarations may be locked.

---

## 12. Automatic generation timer — V1 only

**This entire automatic countdown feature belongs to V1, not MVP.**

There is one shared eight-second inactivity timer.

### Timer triggers

The timer starts or restarts when:

- A CSS declaration becomes Locked.
- A CSS declaration becomes Unset.
- A CSS declaration returns to Free.
- The user changes the locked inspiration style.
- The user clears the inspiration-style lock.

Changing the inspiration lock uses the same timer as CSS constraint changes.

There is no separate inspiration timer.

### Actions that do not trigger generation

Do not start or restart the timer when the user:

- Selects a style for preview.
- Scrolls a column.
- Hovers over a property.
- Interacts with the main preview without changing generation constraints.

### Countdown

Every relevant constraint change resets the timer to eight seconds.

When eight seconds pass without further constraint changes, generation starts automatically.

The Generate button remains at the bottom of the CSS column.

During the final three seconds, its label should show:

- `Sending in 3…`
- `Sending in 2…`
- `Sending in 1…`

Before those final three seconds, it can simply say `Generate`.

When generation begins, show `Generating…`.

After completion, return to `Generate`.

Clicking the button during the countdown immediately starts generation and cancels the timer.

### Changes while generation is running

Users may continue interacting with the interface and changing constraints during generation.

However, do not automatically queue another generation while one is in progress.

The active batch must use the constraint snapshot captured when it started.

For example:

1. The user locks two CSS declarations.
2. Eight seconds pass.
3. Generation starts using those two locks.
4. During generation, the user locks a third declaration.
5. The current generation continues with its original two-lock snapshot.
6. The third lock immediately affects the live preview.
7. No second automatic generation is queued.
8. After the first generation finishes, indicate that the current constraints have not yet been used for a new generation.
9. The user may click Generate manually, or make another constraint change to start a fresh countdown.

Do not silently discard changes made during an active generation.

Avoid surprising duplicate requests and unnecessary costs.

### Manual generation remains available

V1 preserves manual generation.

Users can click Generate at any time when no generation is currently running, even without active locks.

The eight-second timer supplements the Generate button; it does not replace it.

---

## 13. V2 — custom CSS declarations

Do not implement this feature in MVP or V1.

In V2, users should be able to manually enter new CSS properties and values under any existing CSS class.

For example:

```css
.card {
  outline: 2px solid purple;
}
```

A newly added declaration should initially be Locked.

It should participate in:

- Live CSS overrides.
- Future generation constraints.
- Normal CSS precedence.

### Deferred lifecycle decision

We have not yet decided when a manually added declaration should disappear.

Possible situations include changing style cards, unlocking it, generating again, or ending a session.

Do not implement or decide this behavior now.

Document it as a deliberately deferred V2 product decision, not as a blocker for the MVP or V1.

Do not introduce V2-specific complexity into the earlier milestones unnecessarily.

---

## 14. Architecture and implementation expectations

Use React and TypeScript.

Choose the build tooling, styling solution, project organization, testing tools, and state-management approach based on actual needs.

Prefer straightforward, maintainable architecture.

Important considerations include:

- A common style schema for presets, Joker, and Antigravity results.
- Separation of original styles from live overrides.
- Separate preview selection and inspiration-lock state.
- Stable identifiers for styles, CSS selectors, and declarations.
- Consistent CSS cascade behavior.
- Immutable generation constraint snapshots.
- Progressive asynchronous results.
- Deterministic application of locked CSS values.
- Safe parsing and validation of AI-produced style definitions.
- Controlled request concurrency.
- Loading, completion, and error states.
- Easy expansion from two results to six.
- Practical latency and cost instrumentation.

### Antigravity integration

Use `antigravity-preview-09-2026`.

Research or verify the actual supported integration method during planning.

Do not assume it works exactly like an ordinary Gemini generate-content endpoint.

Do not expose secrets or API credentials to the browser.

Use secure server-side execution where required.

Do not automatically replace the selected system with another model if integration fails.

Do not implement fallback models or alternative AI providers.

The local Joker is a permanent product feature, not an error fallback.

Basic error reporting and the ability to retry a failed request manually are appropriate. Do not build complex automatic recovery or fallback workflows.

### Scope discipline

Do not over-engineer.

Avoid building:

- A complete visual website builder.
- A universal CSS editor.
- An unnecessarily complex custom CSS cascade engine.
- Extensive backend persistence without a demonstrated need.
- Mobile-specific UI.
- Model fallback systems.
- Mandatory AI-result deduplication.
- Complex orchestration that does not improve measured user experience.

Use as few dependencies as practical.

Favor working vertical slices.

---

## 15. Release acceptance expectations

### MVP

The MVP should demonstrate:

- A desktop-focused four-column interface using approximately 60 / 7 / 7 / 26 proportions, with freedom to adjust.
- A substantial main website preview.
- Several predefined styles.
- A growing generated-styles column.
- Scrollable style and CSS columns.
- Clearly indicated selected styles.
- Smooth styling transitions.
- A CSS inspector grouped by classes/selectors.
- Free, Locked, and Unset declaration controls.
- Multiple simultaneous CSS locks.
- Live locked-value overrides.
- Effective CSS values without displaying overridden originals.
- Correct source-order-aware CSS behavior.
- Manual Generate button.
- No automatic generation timer.
- One instant local Joker style.
- One quick Antigravity-generated style.
- Immediate loading placeholders and automatic scrolling to new results.
- Shared constraint snapshots.
- Safe API integration without model fallback.
- Basic error handling and testing.

### V1

V1 should additionally demonstrate:

- A richer and more complete website preview.
- One exclusive inspiration lock shared by both style columns.
- Inspiration independent of current preview selection.
- CSS locks taking priority over inspiration.
- Six new cards per generation.
- One instant Joker, one quick AI result, and four additional AI results.
- Progressive results as they become available.
- Parallel or otherwise efficient AI generation where appropriate.
- Acceptance of identical or similar AI results without mandatory deduplication.
- One shared eight-second timer for CSS and inspiration-lock changes.
- Final-three-second countdown on the Generate button.
- No queued automatic generation during an active request.
- Preserved edits made while generation is running.
- Practical performance and cost measurements.

### V2

Keep the future manual CSS-authoring requirement documented.

Do not implement it during the MVP/V1 roadmap.

---

## 16. Milestone-based development and persistent documentation

Build this application incrementally using a milestone-based development process.

Start in Plan mode.

Review the product specification and propose a roadmap of approximately **10–30 meaningful, independently verifiable milestones**.

Choose the actual number and sequence based on the project's complexity.

Favor working vertical slices over extensive upfront scaffolding.

### Persistent documentation

Before substantial implementation, establish concise persistent documentation file or files.

Include:

- Durable repository instructions, including how to resume work in a fresh thread.
- Approved product requirements, including MVP, V1, and deferred V2 scope.
- The milestone roadmap and acceptance criteria.
- Current development status.
- Material technical decisions and their rationale.
- Unresolved or deferred product issues.
- The next recommended action.
- The relevant validation commands and observed results.

Keep documentation accurate and avoid duplication.

Treat the source code and observed test results as authoritative for implementation state.

### Milestone execution

Once the roadmap is approved, implement the selected milestone autonomously.

You choose:

- Architecture.
- Code organization.
- Technical subtasks.
- Dependencies.
- Appropriate validation methods.

Avoid unnecessary process overhead.

At the end of every milestone:

1. Validate the implementation.
2. Fix discovered problems within the milestone's scope.
3. Update the relevant documentation.
4. Report what is working.
5. Report what remains.
6. Identify the recommended next milestone.

Keep the project ready for a fresh Codex conversation at milestone boundaries.

Do not rely on conversation history as the sole record of important requirements or decisions.

### Decision authority

Work within the approved milestone rather than silently expanding scope.

Do not ask for approval on routine technical decisions.

Ask only when a product-level choice, significant tradeoff, or irreversible operation requires my decision.

Do not silently alter approved product behavior.

---

## 17. What I want from you now

For this first planning session:

1. Review this specification.
2. Ask up to seven important questions, if necessary, in one batch.
3. Present your understanding of the product and its interaction model.
4. Propose an appropriate architecture.
5. Identify any concrete constraints of the specified Antigravity integration.
6. Propose approximately 10–30 milestones, clearly separating MVP from V1.
7. Provide verifiable acceptance criteria for each milestone.
8. Identify significant technical decisions and their rationale.
9. Document any deliberately deferred product decisions, especially V2 custom CSS declaration lifetime.
10. Establish concise persistent project documentation for future Codex threads.
11. Recommend the first implementation milestone.

**Do not begin substantial implementation until I approve the roadmap.**

The objective is to let you make consistent, autonomous progress across many milestones while preserving the product specification, important technical decisions, and accurate development status across conversation boundaries.
