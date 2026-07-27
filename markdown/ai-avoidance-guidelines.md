# BGOC — Guidelines: Build Like a Human Team Built This

This file exists to prevent one specific failure mode: the app looking or reading like it was thrown together by AI. Feed this to Antigravity alongside the Blueprint documents. Check every screen and every piece of copy against it before calling anything "done."

## The test

Before shipping any screen, page, or piece of writing, ask: **would a real customer in Asese, reading or seeing this, ever suspect a machine wrote or designed it?** If yes, it needs another pass. This isn't about hiding that AI tools were used to build BGOC — it's about the end result reading like it was made by a real, skilled local team, because that's what makes people trust it (per Document 2's Positioning and Document 4's User Psychology).

---

## Part 1 — Writing and content

### Avoid these AI tells

Do not use these words and phrases anywhere in the app — landing page, product descriptions, error messages, buttons, emails:

- "Elevate," "seamless," "unlock," "empower," "revolutionize," "game-changer," "leverage," "robust," "cutting-edge," "unparalleled"
- "In today's fast-paced world," "in the ever-evolving landscape of," "whether you're X or Y"
- Opening a paragraph with "Imagine..." or "Picture this..."
- Three-item lists that all start with the same gerund ("Discover, explore, enjoy...")
- Vague superlatives with nothing concrete backing them ("the best pizza experience," "amazing quality") — say the specific thing instead ("wood-fired, ready in 20 minutes")
- Overly balanced, hedge-everything sentences that commit to nothing
- Emoji used as decoration rather than meaning (occasional, purposeful use is fine; scattering them for "warmth" is not)

### Write the way an actual person at Pinnacle Mall would talk

- Simple English, short sentences. If a Junior Secondary School student wouldn't understand a word, use a simpler one.
- Say things specifically. "Fresh bread every morning" beats "quality baked goods delivered with care."
- Let personality come from specifics, not adjectives. Don't say a pizza is "delicious" — describe what makes it good (the toppings, how it's made, how fast it arrives).
- Contractions are fine and often better ("we'll," "you're," "it's") — this is a warm local brand, not a legal document.
- Humor and warmth should come from real observations, not generic friendliness. "Your bread is on its way" is fine. "We're absolutely thrilled to bring you this delightful experience" is not.
- Errors and empty states speak plainly, per the frontend-design principle: say what happened and what to do next, without apologizing excessively or being vague. "Your delivery address is missing — add one to continue," not "Oops! Something went a little wrong."
- Every store's copy should sound like it was written by someone who actually knows that store — the way Celebrity Styles talks about a dress is different from how Yurmealicious Pizza talks about a pizza, even though both follow the same simple-English, no-jargon rule.

### Test before publishing any copy

Read it out loud. If it sounds like something you'd actually say to a customer standing in front of you at Pinnacle Mall, it passes. If it sounds like a brochure, rewrite it.

---

## Part 2 — Visual design and code

### Avoid the three most common "AI-generated" design defaults

These patterns show up so often in AI-built apps that people now recognize them on sight — avoid all three unless there's a specific reason tied to BGOC's actual brand (there isn't, since BGOC's palette is already fixed to the red/gold/white Beverly badge):

1. Warm cream background with a high-contrast serif and a terracotta/clay accent color
2. Near-black background with one bright neon-green or vermilion accent
3. Broadsheet/newspaper layout with hairline rules, zero rounded corners, and dense columns

BGOC's platform-level palette is already fixed (Document 1): deep red `#E9271A`, gold `#FBC02D`, white `#FFFFFF`, near-black `#1A1A1A` — used for the app icon, splash screen, and platform-level moments. Each store carries its own separate logo, uploaded by that store when it registers. The design challenge is holding both layers together: a consistent platform frame (red/gold/white, the B badge, the ornate serif wordmark) around each store's own distinct logo and photography — never a generic template that happened to get colors dropped in.

### Design like a professional was hired, not like a template was filled in

- Every screen should feel intentional: the seven-store grid, the store pages, checkout — none of them should look like a default e-commerce starter kit with a red color swapped in.
- Typography runs on **Inter** for all UI text (headings, body, buttons, labels, nav) and **Roboto Mono** for numeric/data elements (prices, order IDs, timestamps) — this pairing is now fixed (see Document 1). Don't default to a generic system font stack or substitute other faces.
- The logo displays as an icon only, with no accompanying wordmark, on both the marketing page and every dashboard. Don't add text back into the logo lockup.
- Don't over-animate. Excess motion (things sliding in from everywhere, hover effects on everything) is one of the clearest signs of an AI-generated interface. Use motion only where it helps someone understand what just happened (e.g. a cart icon confirming an item was added) — not as decoration.
- Numbered steps, badges, and labels should only appear where they encode real information (e.g. order status steps), not as decorative structure copied from generic templates.
- Spend visual boldness in one place per screen — one clear focal point — and keep everything else disciplined and quiet, rather than everything competing for attention.
- Build to a real quality floor: fully responsive on mobile (most Nigerian users will open this on a phone first, not a desktop), visible focus states for accessibility, no broken layouts at common phone widths.

### Before calling any screen finished

Take a screenshot (or look at it fresh) and ask honestly: does this look like it was built by a professional software developer who understands this specific brand, or does it look like a generic template? If it's the latter, it needs another pass — specifically, look for anything that could have been generated for literally any other business by swapping the logo and colors. If a design choice would survive that swap, it's not specific enough to BGOC.

---

## How to use this file with Antigravity

Include this file in every session where Antigravity is writing user-facing copy or building any screen. When reviewing Antigravity's output, run it against the two tests above (the "would a real customer suspect AI" test for copy, and the "would this survive a logo-swap" test for design) before accepting the work as complete.