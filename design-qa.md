# Design QA — Homepage option 1

## Visual truth and test state

- Selected visual: `/Users/berry/.codex/generated_images/019fa399-ea9c-78f1-beed-6269a536de84/exec-8c4c7642-121c-4230-9fed-4982ad514b44.png`
- Implementation: `http://localhost:3004/`
- Browser viewport: 1280 x 720 CSS pixels
- Implementation screenshot: `/private/tmp/charity-option1-viewport.png` (1280 x 720)
- Full-view comparison: `/private/tmp/charity-option1-comparison.png`
- Focused hero comparison: `/private/tmp/charity-option1-hero-comparison.png`
- Cleaned story-section screenshot: `/private/tmp/charity-home-clean-stories.png`
- Cleaned story comparison: `/private/tmp/charity-home-clean-stories-comparison.png`
- Final simplified screenshot: `/private/tmp/charity-home-final-clean.png`
- Final simplified comparison: `/private/tmp/charity-home-final-clean-comparison.png`

## Comparison findings

- Preserved the selected navy, eucalyptus green and wattle-gold identity.
- Matched the split hero structure: editorial copy at left, authentic community photograph at right.
- Matched the clear headline scale, restrained supporting copy, paired primary and secondary actions, and independence notice.
- Added the selected Community in Action sequence immediately below the hero using published story data and approved local fallback photographs.
- Removed Field notes, Events and Learning category labels from homepage cards to reduce competing text; categories remain in the content model for backend organisation and the Stories page.
- Removed the older duplicate homepage story filter and its second story grid. The homepage now has one concise Community in Action feed; the full archive remains on the Stories page.
- Kept the existing public Ask a question control because it is a required website workflow, while avoiding interference with the hero reading order.
- No decorative colour dots, gradients, placeholder assets, broken crops or unreadable overlaps remain in the reviewed viewport.

## Functional checks

- Find support links to `#support-pathways` and scrolls to the support routes.
- Get involved links to `/get-involved`.
- Three Community in Action story links point to `/stories`.
- Homepage content reads from `/api/home`; story cards read from `/api/posts` with seed fallbacks.
- Homepage hero image URL and accessible description are available in the existing Admin Page Manager for Administrator and Owner roles.
- The existing Admin Panel navigation and About, Home and Stories scrolling structure were not redesigned.
- Browser console check: no warnings or errors in the reviewed homepage state.
- Browser verification found zero All, Field notes, Learning or Events filter buttons and no duplicate story-section heading.

## Validation history

- ESLint passed.
- Vinext production build passed.
- Rendered contract tests passed: 5 of 5.
- `git diff --check` passed.

## Our Work follow-up

- Replaced the abstract Our Work hero with a different authentic activity photograph and a smaller editorial headline.
- Added real imagery to the three permanent work areas.
- Removed feed rendering from Our Work; all published updates now live in News and Stories.
- Added a single clear route from Our Work to News and Stories and the official Facebook group.
- Removed the detailed fundraising process statement from Our Work after review; it remains a News and Stories publication safeguard.
- Current evidence and findings are recorded in `our-work-audit.md`.

final result: passed
