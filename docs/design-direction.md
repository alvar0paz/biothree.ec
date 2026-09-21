# Biothree styling audit and redesign prompt

## Scope

Reviewed the live desktop homepage and product page, plus the source for the shared styles, navigation, footer, product cards, science page, FAQ, cart controls, and animations. Mobile observations below are source-based risks and design requirements; a mobile visual audit has not yet been performed. This document proposes a direction; it does not implement the redesign.

## Proposed direction

**Contemporary Japanese health-science editorial.** Warm, precise, tactile, and quietly confident. Express the brand through composition, product presentation, typography, and functional detail. Preserve the existing palette, font families, logo, Spanish content, and commerce behavior.

The defining gestures:

- Warm ivory as the continuous page canvas, with open sections and fine rules.
- Purple used deliberately for primary actions, active states, and a few meaningful highlights.
- Large product photography, consistent baselines, and generous space around the purchase decision.
- Compact corner radii and clear distinctions between controls, surfaces, and labels.
- Short, responsive interaction feedback; calm reading areas.

Japanese influence should come from restraint, proportion, and precision. Do not introduce decorative Japanese text, invented seals, or unsupported authority cues.

## Audit

| Priority | Finding | Evidence | Proposed change |
| --- | --- | --- | --- |
| High | Too many sections use the same visual container. | Benefits, usage steps, science rows, product details, FAQ, and final CTA repeatedly use rounded panels, thin borders, and pale fills. | Establish open editorial sections, ruled information rows, and contained purchase surfaces as distinct treatments. Avoid consecutive sections with identical composition. |
| High | Typography lacks an intermediate level. | Section titles reach 52px, while product names, prices, subheadings, and FAQ questions mostly share the 18px `bt-h3` treatment. Lead copy is only 17px against 16px body copy. | Introduce explicit product-title, subsection, price, body, and metadata roles. Use size, weight, spacing, and line length together. |
| High | Product imagery has too little presence. | A 128px image sits inside a 190px tinted stage, itself nested in a bordered card. The visible assets also contain white rectangular backgrounds. | Increase the visible package scale, use a neutral image stage that works with the existing asset background, and remove unnecessary framing. Preserve the actual product packaging. |
| High | Product information competes with purchasing. | Right-aligned descriptions wrap into several lines; tiny uppercase labels, usage links, shipping notes, and promotion links accumulate around the CTA. | Keep a distinct purchase block. Use readable left-aligned specification rows, consistent image/title/price/action regions, and one quieter shipping treatment. Preserve access to all information. |
| High | CSS overrides undermine intentional spacing. | Unlayered `.bt-h3` and `.bt-p` set `margin: 0`, defeating layered `mb-*` utilities. Global resets override paragraph padding and anchor colors; local `!` overrides already appear. | Resolve cascade ownership before visual tuning. Give component spacing and interactive colors a predictable source. Avoid adding more arbitrary specificity. |
| Medium | Corner treatment is indiscriminate. | Cards use 24px; science panels use 28px; inner stages use 18px; buttons and inputs use full pills. | Use a small radius scale tied to purpose: 6px small details, 10px controls, 16px contained surfaces. Reserve full rounding for true status pills. |
| Medium | Motion is decorative and repetitive. | Hero artwork cycles every 1.6 seconds with additional continuous floating. `Reveal` applies the same 500ms entrance widely. Non-clickable benefit and science panels lift on hover. | Keep one stable hero composition, limit entrances to a few important moments, and concentrate motion on controls and state changes. Remove hover elevation from informational panels. |
| Medium | Small supporting text loses readability. | Product labels fall around 9.6–10.4px, trust-strip text around 10.9px, and notes around 12px in the source. | Use 12–13px metadata and 14px supporting information. Keep dosage and shipping conditions at readable body sizes. |
| Medium | Purple lacks a clear functional role. | Pale purple is repeated as decoration while the primary buttons are black. | Assign purple to the main purchase action and active states; use ink for headings and restrained neutral secondary actions. Keep the exact palette. |
| Medium | Header, footer, and legacy routes need consistency checks. | Marketing fonts are scoped to `.biothree`; header/footer sit outside it. Global body styling uses Figtree. `/acerca-de` and the generic Shopify product route use older page treatments. | Set explicit font roles using existing families, and carry the shared control/spacing system through reachable shopping pages and cart states. |
| Medium | Some controls need more complete interaction treatment. | Cart steppers have 32px visual targets; buttons use broad `transition-all`; add-to-cart has a loading label but limited state styling. | Provide at least 44px effective touch targets, precise transitions, visible keyboard focus, and explicit loading, success, error, disabled, and sold-out treatments where applicable. |

## Proposed design values

These values are starting constraints, not measurements of the current site.

| Role | Desktop | Mobile / behavior |
| --- | --- | --- |
| Hero title | 64–76px, Inter Tight, weight 500–600, line-height 1.02–1.08 | 38–44px; natural Spanish wrapping |
| Section title | 38–48px, Inter Tight, line-height 1.08–1.15 | 28–34px |
| Product / subsection title | 22–28px | 20–24px |
| Product price | 24–28px, tabular numerals | 22–26px |
| Introductory copy | 18–20px | 17–18px |
| Body copy | 16–17px, line-height 1.55–1.7 | At least 16px for substantive content |
| Supporting copy | 14px | 14px |
| Labels / metadata | 12–13px, IBM Plex Mono sparingly | Do not shrink to fit |
| Reading measure | Roughly 55–68 characters | Reflow within viewport gutters |
| Radii | 6 / 10 / 16px by role | Same roles across breakpoints |
| Spacing scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px | 20–24px page gutters |
| Control feedback | 140–180ms | Color, border, icon translation, subtle press |
| Panels / accordions | 200–260ms | No abrupt layout jumps |
| Limited entrance motion | 300–400ms, 6–8px maximum movement | Content remains available without animation |

## Reusable implementation prompt

```text
Act as a senior product designer and frontend engineer. Redesign the presentation of the existing Biothree Ecuador storefront toward a contemporary Japanese health-science editorial: warm, precise, tactile, and quietly confident.

Use docs/design-direction.md as the audit and design brief. Inspect the current components and rendered pages before editing. Implement a coherent visual system across the homepage, /productos, /ciencia, navigation, footer, product cards, and cart. Audit reachable product-detail and supporting pages for consistency. Preserve existing work in the repository.

Treat the "Button and CTA addendum" below as the detailed specification for every action surface. It takes precedence over the more general button guidance in this prompt.

FIXED BRAND AND FUNCTIONAL CONSTRAINTS
Keep the existing color palette, font families, logo, product assets, and Spanish content. Introduce no new fonts or brand colors. Preserve Shopify prices, variants, availability, cart submission, checkout, analytics, and the Instagram fallback when product data is unavailable. Homepage and product-page purchase cards must continue to use the same shared component. Do not invent claims, certifications, testimonials, ratings, or statistics. Do not deploy as part of this redesign.

COMPOSITION
Use the warm ivory canvas as the continuous background. Create a deliberate sequence of an expressive hero, open editorial information, strong product presentations, and compact service information. Establish shared alignment lines and varied section proportions. Use asymmetric layouts where they help the reading order. On mobile, make the order intentional rather than merely collapsing desktop columns. Use fine rules and whitespace to organize information. Reserve bordered containers for content that benefits from containment. Avoid repeated three-card grids, nested panels, and a rounded box around every section.

TYPOGRAPHY
Retain Inter Tight for expressive headings, Inter for reading and controls, and IBM Plex Mono for sparse technical labels. Respect existing brand typography and fallbacks. Establish separate roles for hero titles, section titles, subsection titles, product names, prices, body copy, and metadata. Start with desktop hero titles at 64–76px, section titles at 38–48px, product titles at 22–28px, lead copy at 18–20px, and body copy at 16–17px. On mobile use 38–44px hero titles and 28–34px section titles. Keep supporting copy around 14px and metadata at 12–13px. Tune line-height and tracking for real Spanish text. Keep long passages to approximately 55–68 characters per line. Do not use tiny uppercase labels or excessively tight tracking to create sophistication.

SHAPE AND SURFACES
Use a disciplined radius system: approximately 6px for small details, 10px for buttons and inputs, and 16px for product surfaces or dialogs. Reserve pill shapes for compact status indicators. Coordinate inner and outer radii through consistent inset geometry. Prefer solid surfaces, fine borders, and restrained separation. Use shadows to communicate elevation only. Avoid repeated glows, gradient washes, glass panels, and large ambient shadows.

PRODUCT PRESENTATION
Make the packaging visually substantial. Enlarge the visible product within a quiet stage that accommodates the existing image backgrounds. Do not distort, redraw, or crop package labels. Align image, title, price, and purchase regions across both presentations while allowing natural content height. Give the price a clear role and the purchase action a stable position. Make specifications readable, with left-aligned values and sensible wrapping. Place secondary guidance and shipping information below the main decision hierarchy. Preserve all product information and both purchase/fallback states.

BRAND ACCENTS
Give the existing saturated purple a deliberate job: primary purchase actions, active navigation, keyboard focus, and selected details. Keep headings in ink and backgrounds predominantly ivory or white. Develop one subtle recurring detail, such as a short purple rule paired with a mono section label. Repeat it sparingly. Avoid ornamental Japanese characters, fake laboratory notation, excessive badges, or unrelated decorative symbols.

MOTION AND MICROINTERACTIONS
Replace the rapidly cycling hero with one deliberate composition. Remove continuous floating and hover lifts from non-clickable information panels. Use 140–180ms for control feedback, 200–260ms for accordions and panels, and 300–400ms for a small number of entrance effects. Use one consistent easing curve. Keep movement small and purposeful. Buttons should have clear hover, focus, pressed, disabled, and loading states. Add-to-cart must show pending feedback, confirmed success only after a successful response, and a useful error/retry state when needed. Preserve cart contents and behavior. Keep keyboard focus visible, support touch without hover dependence, and honor reduced-motion preferences. Never hide substantive content until an entrance animation runs.

IMPLEMENTATION QUALITY
Fix the existing cascade conflicts between reset.css, app.css, Tailwind utilities, and unlayered bt-* classes before adding refinements. Centralize typography, radii, spacing, borders, and motion tokens. Use shared components and explicit transition properties. Avoid accumulating !important overrides, route-specific card copies, or new dependencies for simple effects. Maintain semantic heading order and accessible accordion behavior. Keep effective touch targets at least 44px.

VALIDATION
Visually inspect 375px, 768px, and 1440px layouts. Check long Spanish headings, product image proportions, aligned purchase actions, readable dosage/shipping copy, and horizontal overflow. Exercise keyboard focus, reduced motion, accordion expansion, cart opening/closing, and quantity controls. Verify available, sold-out, missing-data/Instagram fallback, loading, and error states on both homepage and product page. Run relevant existing tests, typecheck, lint, and compilation; distinguish unrelated build blockers. Report what changed and any remaining gaps accurately.

The finished site should be recognizable through its composition, typography, product staging, and restrained details even with the logo temporarily covered. Start by implementing the tokens, hero, and shared product card as the foundation, then carry the same decisions through the rest of the site.
```

## Suggested implementation order

1. Resolve cascade conflicts and establish design tokens.
2. Restyle the hero and shared product card to establish the direction.
3. Recompose benefits, usage, science, product details, shipping, and FAQ.
4. Apply the same system to navigation, footer, cart, and supporting routes.
5. Verify responsive layouts and interaction states against the brief.

## Primary source locations

- `app/styles/tailwind.css`, `app/styles/reset.css`, `app/styles/app.css`
- `app/components/marketing/Hero.tsx`, `ProductCard.tsx`, `ProductGrid.tsx`
- `app/components/marketing/BenefitCard.tsx`, `HowItWorks.tsx`, `ScienceTeaser.tsx`
- `app/components/marketing/ProductDetails.tsx`, `ShippingInfo.tsx`, `FAQAccordion.tsx`
- `app/components/marketing/Button.tsx`, `Reveal.tsx`
- `app/components/Header.tsx`, `Footer.tsx`, `CartLineItem.tsx`, `AddToCartButton.tsx`
- `app/routes/_index.tsx`, `productos.tsx`, `ciencia.tsx`, `acerca-de.tsx`, `products.$handle.tsx`

## Button and CTA addendum

### Design intent

Buttons are a defining part of the Biothree identity and purchase experience. They should feel precise, substantial, and responsive. Their beauty comes from proportion, typography, color contrast, and controlled feedback. Their commercial purpose is to make the next action understandable and easy to complete.

Use the same design language from the first homepage CTA through checkout. A customer should recognize a purchase action immediately. Treat increased conversion as an outcome to measure, not a guaranteed consequence of a visual treatment.

This addendum is a specification for the ongoing redesign. The original audit records an earlier implementation. Current code already includes shared `.bt-btn` styling, 10px control radii, larger cart targets, and add-to-cart feedback: refine and preserve that work rather than replacing it with a second system.

### Action hierarchy and placement

| Role | Examples | Visual treatment | Placement rule |
| --- | --- | --- | --- |
| Primary purchase | `Comprar Biothree`, `Agregar al carrito`, `Finalizar compra` | Solid brand purple, white text, weight 600 | One dominant action per decision area; equal product choices may each have one |
| Secondary exploration | `Ver cómo funciona`, `Leer sobre la ciencia` | Transparent or white, ink text, fine visible neutral border, weight 500 | Beside or below the primary, with visibly less emphasis |
| Contextual alternative | `Consultar por Instagram` when product data is unavailable | Soft purple fill, dark-purple text, weight 600 | Replaces the unavailable purchase action; identifies its actual destination |
| Navigation | `Producto`, `Ciencia`, footer links | Unfilled text, weight 500, a fine active indicator | Remains distinct from the header's compact filled `Comprar` CTA |
| Utility | Cart, menu, close, quantity controls | Quiet 44px square target, 10px radius, 18–20px icon | Same geometry and state behavior across header and cart |
| Tertiary action | Usage/shipping links, `Seguir comprando`, `Quitar` | Readable text with an underline or explicit link affordance | Outside the main purchase button; never competes in size or fill |

Keep the CTA beside the information that justifies the decision. Product price and availability belong immediately above or in the same purchase region as `Agregar al carrito`. Keep shipping conditions readable and nearby, with more detail available through the existing link. Avoid a stack of equally prominent actions.

Do not wrap an entire product card in a link when it contains separate purchase and information controls. Each control must have one clear purpose. Keep both presentations visually equal; do not invent a recommended product or preselect one for commercial reasons.

### Geometry and typography

| Token / role | Specification |
| --- | --- |
| Font | Inter for all action labels, including header and cart; no monospace CTA labels |
| Primary weight | 600; never change weight between hover, focus, and rest |
| Secondary / navigation weight | 500; selected navigation uses color and a rule rather than a weight jump |
| Label case | Sentence case; preserve Spanish accents; no all-caps purchase commands |
| Tracking | Normal to -0.01em; no wide letter spacing |
| Label line-height | 1.25; vertical centering must look balanced with and without icons |
| Compact action | Minimum 44px high, 16–20px horizontal padding, 14px label; header and utility forms |
| Standard action | Minimum 48px high, 20–24px horizontal padding, 16px label; product cards |
| Prominent action | Minimum 52px high, 24–28px horizontal padding, 16px label; hero and checkout |
| Radius | 10px across filled, outlined, soft, and icon controls |
| Border | Reserve 1px in every bordered variant so state changes do not change dimensions |
| Icon | 18–20px, consistent stroke and optical weight; 8–10px label gap |
| Group spacing | 12px between paired actions; 16–24px from supporting copy |

Use content-sized buttons in desktop editorial areas and full-width actions inside product cards and the cart. Align purchase-button baselines across adjacent product cards. Keep the shape proportional: a full-width button should retain its 48–52px minimum height rather than becoming an oversized banner.

At narrow widths, stack paired CTAs and make the primary full width. Preserve comfortable side gutters. Use minimum heights rather than fixed heights so enlarged text can wrap without clipping. Do not shrink labels to fit. Reserve enough room for the longest loading/retry label so state changes do not shift nearby content.

Icons are optional. An understated trailing arrow can accompany a navigation CTA; a bag icon may accompany `Agregar al carrito`. Keep wording sufficient without the icon. Avoid circles, segmented icon compartments, double arrows, or a different icon style for every action.

### Color and surface behavior

Use only the existing palette. Treat color as a semantic system, not a per-section decoration.

| Variant | Rest | Hover | Pressed |
| --- | --- | --- | --- |
| Primary | `#3e20e6` fill, white label, matching border | `#240b85` fill and border, white label | Dark-purple fill; restrained inset depth |
| Secondary | Transparent/white fill, `#111111` label, subtle ink-derived border | `#ece8ff` fill, `#240b85` label, purple border | Same palette with a small press response |
| Soft / fallback | `#ece8ff` fill, `#240b85` label | Slightly stronger existing-purple tint, dark-purple label | Stronger border or subtle inset depth |
| Navigation / text | Ink or contextual dark-purple text | Purple text and a fine underline | Same color; no bounce or resizing |
| Utility | Transparent fill, ink icon, optional neutral border | Soft-purple fill, dark-purple icon | A small press response |

On a dark-purple section, use an explicitly defined inverse primary: white surface and dark-purple text, changing to soft purple on hover. This is a surface adaptation of the same purchase hierarchy. Do not place a purple button on a similarly purple background without adequate separation.

Use a visible 2px focus outline with 3px offset. On dark surfaces, use a light outline and contrasting gap. Keyboard focus must remain legible alongside hover or pressed states and must not be clipped by a parent container.

Disabled controls use a neutral surface and readable muted text with an explanatory label nearby when necessary. Do not make pending purchase buttons appear sold out by applying blanket opacity. Pending is a processing state; sold out is an availability state. Keep status meaning explicit in words.

### Motion and tactile feedback

- Use the shared easing `cubic-bezier(0.2, 0.7, 0.3, 1)` and explicit transition properties. Color, border, and shadow transitions take 160ms; release from a press takes approximately 120ms.
- On pointer hover, change the primary button's surface and optionally add a very small neutral shadow. Keep its body stationary. A trailing navigation arrow may translate 2px without shifting the label.
- On press, allow at most a 1px downward translation for filled and utility buttons. Do not scale the text, spring, wobble, or rebound.
- Apply hover-only movement within `(hover: hover) and (pointer: fine)`. Touch users get immediate pressed feedback without sticky hover effects.
- Loading uses a restrained 16px progress indicator, if included, plus a readable verb. Keep the label centered and the button width stable. Show pending feedback immediately; never delay a real response to finish an animation.
- Active navigation gets a fine rule in a reserved indicator area. Animate its opacity or length over 160ms; do not move the surrounding layout or create a bouncing navigation pill.
- Respect reduced motion: remove translation, animated drawing, and spinning. Keep a static pending indicator and clear text. Focus and state changes remain visible.
- No repeating CTA pulse, shimmer, magnetic cursor, animated gradient, confetti, or decorative motion intended to pressure a click.

### Purchase state contract

| State | Label / feedback | Required behavior |
| --- | --- | --- |
| Ready | `Agregar al carrito` | Adds exactly the displayed presentation and selected quantity |
| Pending | `Agregando…` | Prevent duplicate submissions, set `aria-busy`, preserve geometry and current selection |
| Confirmed | `Agregado al carrito` in persistent cart/status feedback; optional short inline check | Show confirmation only after a successful response; open the cart using the existing success callback without an artificial delay |
| Adjusted | Clear message explaining that quantity or availability changed | Preserve Shopify's adjusted result and direct the customer to review it; do not present a warning as unconditional success |
| Error | `Reintentar` with a concise nearby explanation | Preserve selection and allow retry after a definitive failure; distinguish connection issues from unavailable inventory when known |
| Sold out | `Agotado` | Disabled purchase button; keep the card and explanation readable |
| Product data unavailable | `Consultar por Instagram` | Preserve the existing working fallback and its external destination; do not fabricate a price or enabled cart action |
| Checkout | `Finalizar compra` | Open the actual Shopify checkout URL; never imply that clicking already completes payment |

Reuse the existing `AddToCartFeedback` state handling and extend its presentation where needed. A confirmation must not permanently lock out another legitimate purchase. Error and adjustment messages remain until resolved or superseded; they must not disappear on a decorative timer. Avoid blindly retrying a timed-out mutation when its outcome is unknown; reconcile cart state first where necessary.

Announce asynchronous results once through a concise live region. Returning a fetcher to idle is not sufficient proof of success. Keep disabled semantics native for buttons. Navigation remains a link; never simulate an unavailable link solely through opacity or `pointer-events`.

### Navigation, cart, and mobile details

Navigation communicates location and movement. Use `aria-current="page"` and an active indicator that does not depend only on color. Keep `Comprar` prominent in the header while ordinary navigation remains quieter. Menu and cart triggers need descriptive accessible names; menu expansion and drawer focus behavior must stay correct.

Cart quantity controls should feel like one compact group: aligned 44px effective targets, stable tabular quantity text, clear limits, and local pending feedback. Keep `Quitar` visible as a quieter action, not an ambiguous unlabeled icon. The checkout action is the strongest control in the cart; coupon entry and `Seguir comprando` stay subordinate.

On mobile, keep checkout reachable within the existing cart layout and account for bottom safe-area insets. Do not add a persistent page-wide buy bar by default. If a later design introduces one, show it only when the original action is out of view, retain the selected presentation and price, and avoid covering content, keyboard focus, or form fields.

### Commercial clarity and measurement

Use labels that describe what will actually happen. `Comprar Biothree` navigates to the presentation choice; `Agregar al carrito` adds a specific item; `Finalizar compra` proceeds to checkout. Avoid vague commands such as `Descubrir` on purchase controls.

Support the decision with accurate availability, price, shipping conditions, and payment information. Do not add invented urgency, unverified security seals, fake popularity counts, or unimplemented delivery guarantees. Keep the free-shipping threshold discoverable without turning it into another competing button.

Preserve existing commerce analytics. If measurement is extended later, distinguish CTA location (header, hero, product card, final section, cart), presentation, attempted add, confirmed add, and checkout navigation. Count confirmed additions from successful results rather than clicks. Evaluate progression from product view to confirmed cart addition and checkout, alongside error and repeat-submission rates. Do not claim that a button color alone caused a sales change.

### Shared implementation and acceptance

Use one button foundation, one size scale, and role-based variants across `Button`, `buttonClasses`, `AddToCartButton`, cart checkout links, and utility controls. Preserve native link/form behavior, keyboard activation, analytics, and router navigation. Keep visual state independent from the element type so a checkout anchor and an add-to-cart submit button share the same visual quality.

Check the actual Shopify product form as well as marketing cards; avoid leaving a default browser purchase button elsewhere in the shopping journey. Account for pending, disabled, expanded, and current-page states in the shared component API. Use no additional animation dependency for these controls.

Before considering the button work complete:

- Review the full variant/state set on ivory, white, and purple surfaces.
- Verify the header CTA, hero pair, both product cards, fallback, footer CTA, cart controls, coupon action, and checkout at 375px, 768px, and 1440px.
- Check hover, keyboard focus, press, touch, reduced motion, long Spanish labels, and 200% text zoom. Focus and labels must remain visible and uncut.
- Check readable text contrast with a contrast tool; target at least 4.5:1 for button labels and 3:1 for essential control boundaries and focus indicators against adjacent colors.
- Confirm stable button dimensions during loading, no duplicate cart submissions, accurate success/error feedback, and unchanged product selection.
- Evaluate each screen at a glance: the main action should be obvious, secondary actions should remain accessible, and all controls should belong to the same brand.

### Prompt extension

```text
Give buttons and CTAs the same design attention as the hero and product imagery. Follow the Button and CTA addendum in docs/design-direction.md as the detailed action-system specification.

Build a cohesive family of primary purchase, secondary exploration, soft fallback, text navigation, and utility controls. Use Inter, 600-weight primary labels, 500-weight secondary/navigation labels, sentence case, 10px corners, and deliberate 44/48/52px minimum-height roles. Use saturated brand purple with white text for purchases, dark purple for hover, and quiet neutral or soft-purple treatments for supporting actions. Adapt contrast explicitly on dark surfaces.

Make placement, label clarity, and purchase-state feedback central to the design. Keep prices and availability close to buying actions. Preserve the shared product cards, Shopify behavior, analytics, Instagram fallback, and existing asynchronous feedback. Specify every rest, hover, focus, pressed, pending, success, adjustment, error, disabled, and sold-out state. Use restrained 160ms transitions, stable geometry, small press feedback, accessible touch targets, and reduced-motion support.

Refine navigation, hero CTAs, product purchase buttons, cart steppers, checkout, and informational links as one system. The result should feel beautifully integrated, commercially clear, and trustworthy. Implement within the existing shared components and verify responsive and commerce states; avoid route-specific button copies or decorative effects that distract from the purchase decision.
```
