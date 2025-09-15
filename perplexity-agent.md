Sizing and hierarchy

Headings: Use large, bold headings (32–36 px) with generous line height; they should be clear but not overpowering.

Subheadings: 20–24 px weight 500 for section titles.

Body text: 16 px regular weight with 1.5 line height for readability.

Footnotes / captions: 12–14 px light weight using the secondary or monospace font.

Maintain a clear hierarchy; avoid more than three levels of headings on a page.

Layout and spacing

Perplexity’s pages breathe. Whitespace, not borders, separates content:

Base unit: Use an 8 px spacing unit. Standard spacing values are 8, 16, 24 and 32 px.

Page margins: On large screens, constrain content within a 900 px wide column and centre it. The left sidebar uses about 60–72 px and houses only icons.

Vertical rhythm: Maintain generous top and bottom margins around sections (~48 px). Avoid stacking controls too tightly.

Grid: Use a single‑column layout for primary content. Two‑column layouts should have at least 24 px gutter.

Buttons and interactive elements

Perplexity uses a small number of clearly defined button styles. They all have soft corners (8–12 px radius) and ample padding.

Primary button

Colour: Fill with True Turquoise (#20808D); white text. On hover, darken slightly; on active, darken more; on disabled, reduce opacity.

Shape: Rounded rectangle with 8–12 px corner radius.

Size: Height ~40 px with horizontal padding 20–24 px.

Usage: Reserve for the main call‑to‑action on a page (e.g., "Ask" button, sign‑in actions). Do not have multiple primary buttons on the same screen.

Secondary button (ghost)

Colour: Transparent fill with a 1 px border in True Turquoise or Peacock. Text in the same colour. On hover, apply a subtle background tint using Peacock 20 (#D5DDDF).

Usage: Use for secondary actions such as "Compare", "Summarise" or toggles. Keep them low profile and avoid bright fills.

Icon buttons

Small square buttons (32 px) that contain just an icon; they live inside search inputs and cards. Fill them with very light backgrounds (Paper White or Peacock 10). Use the primary colour for the icon strokes and a 6–8 px radius.

Links

Links use the primary colour. Underline them on hover for clarity; avoid underlines at rest. Keep font weight normal.

Input fields and search boxes

Background: Use a light fill such as Paper White or Peacock 10; no hard border. A subtle drop shadow or 1 px outline appears on focus.

Shape: Large rounded rectangle with a 16 px radius (e.g., the central search bar).

Placeholder: Darker mid‑grey (#6B7580) text.

Icons: Place icons inside the input on the left or right; nest them inside small icon buttons rather than drawing them directly on the input.

Sizing: Height around 48 px for primary search; 36 px for smaller text fields.

Cards and panels

Information on Perplexity is organised in simple cards. Follow these guidelines:

Backgrounds: Use Paper White, Peacock 10 or Sky for card backgrounds.

Borders: Avoid heavy borders; instead, use a very subtle 1 px stroke (rgba(0,0,0,0.05)) or no border at all.

Corners: 12–16 px radius for larger panels; 8 px for small list items.

Shadow: A soft shadow (0 2 px 4 px rgba(0,0,0,0.05)) lifts the card from the background.

Padding: 24 px around content. Ensure enough space between cards (24–32 px).

Icons and navigation

Sidebar: Use a vertical sidebar with square icon buttons (48 px) and minimal labels. Highlight the active page with a subtle coloured indicator (Peacock 20 background).

Icon style: Outline icons with consistent stroke width; primary colour for active/interactive icons, mid‑grey for inactive ones.

Spacing: Leave at least 24 px above and below groups of icons.

Shadows and depth

Shadows give subtle depth without obvious layering:

Use soft, diffused shadows (0 1 px 2 px rgba(0,0,0,0.04) and 0 4 px 8 px rgba(0,0,0,0.03)) under cards, modals and inputs.

Avoid multiple layered shadows or heavy drop shadows; minimalism preserves clarity.

General principles

Minimalism over decoration: Elements should breathe and there should be only one or two primary actions per page. The Perplexity palette is streamlined and simple
live.standards.site
.

Consistency: Use the same radius, colours and spacing across components. Stick to the defined palette and typeface hierarchy.

Clarity: Always ensure readability. Use dark text on light backgrounds and maintain sufficient contrast.

Intentional accents: Use warm accent colours sparingly to draw attention or convey status
live.standards.site
. They should never overpower the blues
live.standards.site
.

Respect white space: Let content stand on its own. Separate sections with generous margins instead of hard borders.

Responsiveness: The layout should collapse gracefully on small screens. Sidebar icons become a bottom bar, and spacing scales down but never disappears.

By following these guidelines in your React components and styling (e.g. with CSS‑in‑JS or Tailwind), your application will mirror Perplexity’s clean, modern feel. Use variables for colours, radii and spacing so that the system remains consistent and easy to evolve.