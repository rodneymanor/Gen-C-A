# Perplexity UI Design System Guide

A comprehensive instruction document for understanding and implementing Perplexity's design ideology and component system.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Core Values](#core-values)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Layout & Spacing](#layout--spacing)
6. [Component Hierarchy](#component-hierarchy)
7. [Shadows & Elevation](#shadows--elevation)
8. [Focus States & Interactions](#focus-states--interactions)
9. [When to Use Component Styles](#when-to-use-component-styles)
10. [Implementation Examples](#implementation-examples)

## Design Philosophy

Perplexity's design ideology centers around **simplicity with depth**[1]. The interface appears streamlined and simple at first glance, but there's significant depth underneath that emerges through thoughtful interaction patterns and progressive disclosure[5].

### Core Principles

**Speed as the Primary UX Factor**: Speed is the most important facet of user experience in AI-driven interfaces[7]. Every design decision prioritizes reducing time to value and enabling rapid information discovery.

**Bounded Inputs with Unbounded Scope**: The interface constrains input methods (small search box, constrained options) while allowing vast scope of queries ("Ask anything")[2]. This reduces cognitive load while maintaining powerful capabilities.

**Interpretation and Transparency**: Users can see what the system is doing behind the scenes through clear breakdown of tasks and transparent workflow visualization[2].

**Recognition Over Recall**: Instead of requiring users to remember commands or formulate perfect queries, Perplexity provides suggested follow-up questions and discoverable prompts[5].

## Core Values

### 1. Curiosity & Discovery
The design sparks curiosity and wonder through visual elements and interaction patterns that encourage exploration[34].

### 2. Trust & Authority
Clean, professional aesthetics combined with transparent information sourcing builds user confidence[34].

### 3. Approachability
Despite technical complexity, the interface remains approachable and conversational[5][43].

### 4. Intellectual Minimalism
The design embraces white space and simplicity while maintaining sophisticated functionality underneath[5].

## Color System

This application uses a comprehensive design token system built on modern CSS custom properties. The system is built for flexibility while maintaining brand consistency and full dark mode support.

### Primary Brand Colors

**Bloom Blue Spectrum:**
- **Primary 500**: `#0B5CFF` - Main brand color (Bloom Blue)
- **Primary 400**: `#60a5fa` - Medium-light primary
- **Primary 600**: `#2563eb` - Medium-dark primary
- **Primary 700**: `#1d4ed8` - Dark primary
- **Primary 50-900**: Full scale from lightest tint to darkest shade

### Neutral System (Grays)

**Comprehensive neutral scale for text, borders, and surfaces:**
- **Neutral 0**: `#ffffff` - Pure white
- **Neutral 50**: `#fafbfc` - Off-white surface
- **Neutral 100**: `#f4f5f7` - Light gray surface
- **Neutral 200**: `#e4e6ea` - Subtle border
- **Neutral 300**: `#c1c7d0` - Light border
- **Neutral 400**: `#8590a2` - Medium border/disabled text
- **Neutral 500**: `#5e6c84` - Tertiary text
- **Neutral 600**: `#42526e` - Secondary text
- **Neutral 700**: `#253858` - Strong text
- **Neutral 800**: `#172b4d` - Primary text
- **Neutral 900**: `#091e42` - Darkest text

### Semantic Colors

**Success Green:**
- **Success 50**: `#e3fcef` - Success tint
- **Success 100**: `#abf5d1` - Light success
- **Success 400**: `#00875a` - Medium success
- **Success 500**: `#006644` - Base success

**Warning Orange:**
- **Warning 50**: `#fffae6` - Warning tint
- **Warning 100**: `#fff0b3` - Light warning
- **Warning 400**: `#ff8b00` - Medium warning
- **Warning 500**: `#ff7400` - Base warning

**Error Red:**
- **Error 50**: `#ffebe6` - Error tint
- **Error 100**: `#ffbdad` - Light error
- **Error 400**: `#de350b` - Medium error
- **Error 500**: `#bf2600` - Base error

**Info Blue:**
- **Info 50**: `#deebff` - Info tint
- **Info 100**: `#b3d4ff` - Light info
- **Info 400**: `#0065ff` - Medium info
- **Info 500**: `#0052cc` - Base info

### Creative/AI Colors

**Special colors for AI and creative features:**
- **Creative Purple**: `#8b5cf6` - AI/Creative accent
- **Creative Blue**: `#06b6d4` - Cyan accent
- **Creative Green**: `#10b981` - Emerald accent
- **Creative Pink**: `#f472b6` - Pink accent

### Surface & Background System

- **Surface**: `var(--color-neutral-0)` - Base surface
- **Surface Elevated**: `var(--color-neutral-50)` - Cards, modals
- **Surface Hover**: `var(--color-neutral-100)` - Hover states
- **Surface Active**: `var(--color-neutral-200)` - Active/pressed states

### Text Hierarchy

- **Text Primary**: `var(--color-neutral-800)` (#172b4d)
- **Text Secondary**: `var(--color-neutral-600)` (#42526e)
- **Text Tertiary**: `var(--color-neutral-500)` (#5e6c84)
- **Text Quaternary**: `var(--color-neutral-400)` (#8590a2)
- **Text Brand**: `var(--color-primary-500)` (#0B5CFF)

### Border System

- **Border Default**: `var(--color-neutral-200)` (#e4e6ea)
- **Border Subtle**: `var(--color-neutral-100)` (#f4f5f7)
- **Border Strong**: `var(--color-neutral-300)` (#c1c7d0)
- **Border Interactive**: `var(--color-primary-500)` (#0B5CFF)
- **Border Focus**: `var(--color-primary-500)` (#0B5CFF)

### Color Usage Guidelines

**Use CSS Custom Properties**: Always use `var(--color-token-name)` instead of hardcoded hex values for consistency and theme support.

**Primary Brand Usage**: Use Bloom Blue (`var(--color-primary-500)`) for primary actions, links, and brand elements.

**Semantic Color Application**: Use semantic colors consistently across the application - green for success, red for errors, orange for warnings, blue for information.

**Ensure Contrast**: All color combinations must have sufficient contrast for accessibility (minimum 4.5:1 for text, 3:1 for UI elements).

**Dark Mode Support**: The system includes comprehensive dark mode variants that automatically adjust based on the user's theme preference.

## Typography

Perplexity's typography system balances legibility with personality, using carefully selected typefaces that convey both approachability and intellectual depth[43].

### Primary Typeface: FK Grotesk

**Designer**: Květoslav Bartoš for Florian Karsten Typefaces

**Characteristics**: 
- Subtle ink traps and crisp corners
- Distinctive without being distracting
- Strong personality in headlines, legible at small sizes
- Clean, mechanical appearance with warm feel[34]

**Weights Available**:
- FK Grotesk Regular
- FK Grotesk Light

### Secondary Typeface: Berkeley Mono

**Designer**: Berkeley Graphics

**Usage**: Code display, callouts, and brand accents

**Characteristics**:
- Condensed but clear
- References golden era of computing
- Practical support typeface

**Weights Available**:
- Berkeley Mono Regular  
- Berkeley Mono Bold

### Tertiary Typeface: PP Editorial New

**Designer**: Pangram Pangram Foundry

**Usage**: Editorial content requiring sophistication

**Characteristics**:
- Refined editorial touch
- Contrasts with clean FK Grotesk and techy Berkeley Mono
- Adds sophistication and balance

**Weights Available**:
- PP Editorial New Light
- PP Editorial New Ultralight Italic

### International Support

For Asian character sets, **Source Han Sans** replaces FK Grotesk while maintaining clean lines and broad usability[43].

### Typography Guidelines

1. **Use FK Grotesk as Primary**: Default to FK Grotesk for all primary text elements
2. **Balance with Wordmark**: Ensure the Perplexity wordmark is either slightly smaller or larger than main headlines to avoid competition
3. **Align to Grid**: Type should align to the underlying document grid system
4. **Strategic Grid Breaking**: Occasionally break headlines across columns or shift alignment for visual interest

## Layout & Spacing

Perplexity employs a systematic approach to spacing that creates visual rhythm and hierarchy while maintaining clean, scannable layouts.

### Spacing System Philosophy

Based on research into effective spacing systems, Perplexity likely uses an **8-point grid system** with optional 4-point increments for fine-tuning[32][35]. This provides:

- **Consistency**: All spacing values divisible by 8 (or 4 for small adjustments)
- **Scalability**: Easy multiplication/division for different screen sizes
- **Developer Alignment**: Matches common rem units (16px base = 1rem)

### Recommended Spacing Scale

**Small Values (0-8px)**: Component-level spacing
- 0px, 2px, 4px, 8px
- Use for: Icon-text gaps, small component padding, table cells

**Medium Values (12-24px)**: Element-level spacing  
- 12px, 16px, 20px, 24px
- Use for: Button padding, card content spacing, form elements

**Large Values (32-80px)**: Layout-level spacing
- 32px, 40px, 48px, 56px, 64px, 80px
- Use for: Section separation, page margins, major layout elements

### Layout Principles

1. **Container Padding**: 24px standard wrapper padding[41]
2. **Section Spacing**: 32px between major content sections[41]
3. **Content Spacing**: 16-24px between related elements[41]
4. **Consistent Rhythm**: Maintain regular spacing patterns for scanability[16]

## Component Hierarchy

Perplexity's component system establishes clear visual hierarchy through careful use of styling, contrast, and spacing.

### Button Hierarchy

**Primary Buttons**:
- **Purpose**: Most important action on the page
- **Styling**: High contrast fill (True Turquoise or Plex Blue background)
- **Text**: White text on colored background
- **Usage**: One primary button per view maximum[36]
- **Examples**: "Ask anything", "Get Started", "Submit"

**Secondary Buttons**:
- **Purpose**: Alternative or supporting actions
- **Styling**: Outlined style with brand color border
- **Text**: Brand color text on transparent background
- **Usage**: Less prominent than primary, clearly interactive[36]
- **Examples**: "Edit query", "Try another search"

**Tertiary Buttons**:
- **Purpose**: Least critical actions
- **Styling**: Text-only or subtle tonal fill
- **Text**: Brand color or muted text
- **Usage**: Minimal visual weight, often used for "Cancel" or navigation[36]

### Card System

**When to Use Cards**:
- Grouping related information[18]
- Presenting summaries that link to detailed views[18]  
- Creating scannable content layouts[16]
- Separating distinct content units[16]

**Card Specifications**:
- **Padding**: 16-24px internal padding[16]
- **Borders**: Subtle border or shadow for separation[16]
- **Background**: Slightly different from canvas background[18]
- **Content**: One topic per card[16]
- **Spacing**: 8-16px between card elements[16]

### Tab System

**Usage Scenarios**:
- Organizing related content sections
- Filtering or categorizing information
- Progressive disclosure of complex data

**Visual Treatment**:
- Clear active/inactive states
- Sufficient contrast for accessibility
- Consistent spacing and alignment

## Shadows & Elevation

Shadows in Perplexity's system create depth, hierarchy, and interactive affordances while maintaining the clean aesthetic.

### Shadow System

**Elevation Levels**:

**Level 1 - Subtle Depth** (Cards, form fields):
```css
box-shadow: 0 1px 3px rgba(9, 30, 66, 0.08);
```

**Level 2 - Standard Elevation** (Dropdowns, modals):
```css
box-shadow: 0 2px 8px rgba(9, 30, 66, 0.12);
```

**Level 3 - Prominent Elements** (Primary buttons hover, tooltips):
```css
box-shadow: 0 4px 16px rgba(9, 30, 66, 0.16);
```

### Shadow Principles

1. **Subtle Application**: Shadows should be barely noticeable, enhancing depth without distraction
2. **Consistent Direction**: All shadows follow the same light source direction
3. **Color Matching**: Use neutral dark (`#091e42`) with low opacity for shadow color
4. **Accessibility**: Ensure shadows don't interfere with readability
5. **Flat Design Preference**: This system leans toward minimal shadows, preferring clean borders and color differentiation

### When to Use Shadows

- **Cards**: Subtle shadows separate content from background
- **Buttons**: Light shadows indicate interactivity  
- **Modals/Overlays**: Stronger shadows show elevation above content
- **Focus States**: Enhanced shadows indicate keyboard focus

## Focus States & Interactions

Focus states and micro-interactions reinforce Perplexity's commitment to accessibility and delightful user experiences.

### Focus Ring System

**Standard Focus Ring**:
```css
outline: 2px solid var(--color-primary-500);
outline-offset: 2px;
```

**Alternative Focus Treatment** (for buttons):
```css
box-shadow: 0 0 0 3px rgba(11, 92, 255, 0.3);
```

### Interactive States

**Hover States**:
- Subtle color shifts (5-10% opacity change)
- Slight elevation increase for buttons
- Cursor changes to indicate interactivity

**Active States**:
- Pressed appearance (inset shadow or color darkening)
- Immediate visual feedback

**Disabled States**:
- Reduced opacity (typically 50%)
- Muted colors from the grayscale system
- No interactive cursor

### Micro-Interactions

Based on Perplexity's voice interface work[20], micro-interactions should:
- Provide clear feedback about system state
- Use subtle animations (150-250ms duration)
- Employ easing functions for natural feel
- Maintain performance across devices

## When to Use Component Styles

### Card Style Usage

**Use Cards When**:
- Presenting discrete pieces of related information
- Creating scannable layouts with multiple content items  
- Linking to detailed views or actions
- Grouping form elements or settings
- Displaying search results or content previews

**Avoid Cards When**:
- Content is primarily text-heavy articles
- Creating single-column layouts
- Information doesn't need visual separation

### Button Style Selection

**Primary Button Usage**:
- Main call-to-action per page/section
- Form submissions
- Starting primary workflows  
- High-priority actions

**Secondary Button Usage**:
- Alternative actions of moderate importance
- "Cancel" or "Back" functionality
- Additional options that support the primary action
- Navigation between related sections

**Tertiary Button Usage**:
- Minor actions like "Learn more"
- Settings or preference toggles
- Less critical navigation options
- Actions that shouldn't compete for attention

### Tab Style Application

**Use Tabs When**:
- Content can be logically divided into sections
- Users need to quickly switch between related views
- Screen space is limited but content is extensive
- Creating focused workflows with multiple steps

**Tab Design Specifications**:
- Minimum 44px touch target
- Clear active state differentiation
- Consistent spacing between tabs
- Accessible keyboard navigation

## Implementation Examples

### Example 1: Search Interface

```html
<div class="search-container">
  <div class="search-wrapper">
    <input 
      type="text" 
      placeholder="Ask anything..."
      class="search-input"
    />
    <div class="search-actions">
      <button class="btn-tertiary" aria-label="Voice search">
        <!-- Voice icon -->
      </button>
      <button class="btn-tertiary" aria-label="Attach file">
        <!-- Attach icon -->
      </button>
    </div>
  </div>
  <button class="btn-primary">Search</button>
</div>
```

```css
.search-container {
  padding: 24px;
  max-width: 768px;
  margin: 0 auto;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-300);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'FK Grotesk', sans-serif;
  font-size: 16px;
  color: var(--color-neutral-800);
}

.btn-primary {
  background: var(--color-primary-500);
  color: var(--color-neutral-0);
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-family: 'FK Grotesk', sans-serif;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-600);
  box-shadow: 0 2px 8px rgba(11, 92, 255, 0.2);
}

.btn-primary:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Example 2: Card Layout

```html
<div class="results-grid">
  <article class="result-card">
    <h3 class="card-title">Search Result Title</h3>
    <p class="card-summary">Brief summary of the content...</p>
    <div class="card-actions">
      <button class="btn-secondary">Read More</button>
      <button class="btn-tertiary">Save</button>
    </div>
  </article>
</div>
```

```css
.result-card {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(9, 30, 66, 0.08);
}

.card-title {
  font-family: 'FK Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: var(--color-neutral-800);
  margin-bottom: 12px;
}

.card-summary {
  font-family: 'FK Grotesk', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-neutral-600);
  margin-bottom: 16px;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  background: transparent;
  color: var(--color-primary-500);
  border: 1px solid var(--color-primary-500);
  padding: 8px 16px;
  border-radius: 6px;
  font-family: 'FK Grotesk', sans-serif;
  cursor: pointer;
}

.btn-tertiary {
  background: transparent;
  color: var(--color-neutral-600);
  border: none;
  padding: 8px 12px;
  font-family: 'FK Grotesk', sans-serif;
  text-decoration: underline;
  cursor: pointer;
}
```

### Example 3: Tab Navigation

```html
<div class="tab-container">
  <div class="tab-list" role="tablist">
    <button class="tab-item active" role="tab">Overview</button>
    <button class="tab-item" role="tab">Details</button>
    <button class="tab-item" role="tab">Sources</button>
  </div>
  <div class="tab-content">
    <!-- Tab panel content -->
  </div>
</div>
```

```css
.tab-list {
  display: flex;
  border-bottom: 1px solid var(--color-neutral-300);
  margin-bottom: 24px;
}

.tab-item {
  background: transparent;
  border: none;
  padding: 12px 20px;
  font-family: 'FK Grotesk', sans-serif;
  font-size: 14px;
  color: var(--color-neutral-600);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  min-height: 44px;
}

.tab-item:hover {
  background: var(--color-neutral-100);
}

.tab-item.active {
  color: var(--color-primary-500);
  border-bottom-color: var(--color-primary-500);
}

.tab-item:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: -2px;
}
```

## Quick Reference

### Color Palette Quick Access
- **Primary Text**: `var(--color-neutral-800)` (#172b4d)
- **Secondary Text**: `var(--color-neutral-600)` (#42526e)
- **Tertiary Text**: `var(--color-neutral-500)` (#5e6c84)
- **Primary Background**: `var(--color-neutral-0)` (#ffffff)
- **Surface Elevated**: `var(--color-neutral-50)` (#fafbfc)
- **Primary Brand**: `var(--color-primary-500)` (#0B5CFF - Bloom Blue)
- **Border Default**: `var(--color-neutral-200)` (#e4e6ea)
- **Border Interactive**: `var(--color-primary-500)` (#0B5CFF)
- **Success**: `var(--color-success-500)` (#006644)
- **Warning**: `var(--color-warning-500)` (#ff7400)
- **Error**: `var(--color-error-500)` (#bf2600)
- **Info**: `var(--color-info-500)` (#0052cc)

### Spacing Quick Reference
- **Component spacing**: 4px, 8px, 12px, 16px
- **Layout spacing**: 24px, 32px, 48px, 64px  
- **Container padding**: 24px
- **Section gaps**: 32px

### Typography Quick Reference
- **Primary font**: FK Grotesk
- **Code font**: Berkeley Mono
- **Editorial font**: PP Editorial New
- **Base font size**: 16px
- **Line height**: 1.4-1.6

This guide provides the foundation for creating interfaces that match Perplexity's design ideology of simplicity with depth, speed-focused interactions, and approachable sophistication.