Neo-Brutalism Theme 
Version 1.0  ·  
Complete design reference for the Neo-Brutalism (BrandEx) theme. Use these specs for all future components, pages, and UI additions.
1.  COLOR PALETTE
All colors are CSS custom properties on .theme-neobrutalism. Use exact hex codes only — no approximations.

Color Name
Hex Code
CSS Variable
Usage / Where Applied
Near-Black
#0C0C0C
--bg2 / --border / --black
Navbar, all borders, box-shadows, text on cream
Warm Cream
#F0E8D0
--bg / --panel-hover
Main page background, light section fills
Deep Cream
#E8DFC7
--bg-alt
Alternate section bg, table alternate rows
Off-White
#232323
--panel
Card surfaces, inputs, modal backgrounds
Burnt Orange
#C94A00
--accent / --accent-primary
CTA buttons, active nav, borders, primary actions
Dark Teal
#0A6B52
--accent4 / --teal
Section backgrounds, success states, status dot
Bright Teal
#0D9970
--accent2 / --teal-lt
Links, focus rings, logo, hover highlights
Bold Yellow
#D4A800
--accent3 / --yellow
Warnings, stamp labels, highlighted text

2.  TYPOGRAPHY
Role
Font Family
Weight / Style
Where Used
Display / Headings
Bebas Neue
400 (display weight)
Hero H1, stat numbers, CTA headline, stamp labels
Body Text
Space Grotesk
400 / 500 / 700
All body copy, descriptions, nav links, paragraphs
Labels / Code
DM Mono
500 (medium)
Badges, section tags, clock, uppercase monospace labels
System Fallback
Arial Black / Arial
Bold
Used when Google Fonts unavailable — fully readable fallback

3.  BORDERS & SHADOWS
CSS Variable
Value
Effect / When Used
--border-thin
2px solid #0C0C0C
Subtle dividers, inside table borders, nav link separators
--border-thick
3px solid #0C0C0C
Panels, cards, buttons, section borders
--radius
0px (hard corners)
Core rule — NO rounding. 6px max for buttons/cards only.
--shadow
5px 5px 0 #0C0C0C
Standard card/panel hard offset shadow (no blur)
--shadow-sm
3px 3px 0 #0C0C0C
Small elements — tags, badges, small buttons
--shadow-lg
8px 8px 0 #0C0C0C
Hero elements, prominent featured cards
--shadow-accent
5px 5px 0 #C94A00
Active/selected panels — orange shadow variant
Hover state
translate(-3px, -3px)
Element lifts up-left. Shadow grows to 8px 8px 0
Press / Active
translate(+3px, +3px)
Element presses down-right. Shadow collapses to 0.

4.  STATUS BADGE COLORS
All badges: 2px solid border, uppercase font, monospace, background is ~12% opacity tint of border color.

Badge
Border Color
Text Color
Used For Status
Draft
rgba(12,12,12,0.40)
#555555 (dim)
Not started — default placeholder state
Complete
#0D9970 (Bright Teal)
#0A6B52
Story writing finished, awaiting review
Review
#C94A00 (Orange)
#C94A00
Submitted for approval — pending decision
Approved
#0A6B52 (Dark Teal)
#0A6B52
Green-lit, cleared for publishing queue
Scheduled
#D4A800 (Yellow)
#8a6800 (dark)
Queued with a future publish date/time
Published
#8B2FC9 (Purple)
#8B2FC9
Live on YouTube — cannot be recalled

5.  COMPONENT RULES
Buttons
bg: #C94A00 (primary) / #FAF6EE off-white (secondary)
border: 2.5px solid #0C0C0C on all sides — always visible
border-radius: 6px — slight only, not pill-shaped
box-shadow: 5px 5px 0 #0C0C0C (hard, no blur)
Hover: translate(-2px,-2px) + shadow grows to 7px 7px
Click: translate(+3px,+3px) + shadow collapses to 0
Font: DM Mono, UPPERCASE, letter-spacing: 0.5px
Cards / Panels
background: #FAF6EE (off-white)
border: 3px solid #0C0C0C
border-radius: 6px
box-shadow: 5px 5px 0 #0C0C0C
Hover: translate(-3px,-3px), shadow grows to 8px 8px 0 #0C0C0C
NEVER use gradients or transparency inside cards
Inputs / Forms
background: #FAF6EE
border: 2px solid #0C0C0C (2.5px on focus)
border-radius: 0px — hard corners on ALL form inputs
Focus: border-color → #C94A00 + box-shadow: 0 0 0 2px rgba(201,74,0,0.20)
Placeholder: rgba(12,12,12,0.35)
Tabs / Navigation
Tab bar bg: #F0E8D0 (cream), border-bottom: 3px solid #0C0C0C
Inactive: color rgba(12,12,12,0.55), right-border: 1.5px solid #ddd4ba
Active: color #0C0C0C, border-bottom: 4px solid #C94A00 (orange underline)
Hover: background #E8DFC7 (deep cream)
Navbar / Header
background: ALWAYS #0C0C0C (dark) — never changes with theme
Logo: BRIGHT in #FAF6EE, . in #C94A00, STORIES in #0D9970
Nav links: #888 inactive → #FFF hover → #C94A00 bg active
position: sticky, top: 0, z-index: 100, height: 58px
Stamps / Decorative
Font: Bebas Neue, size 20-24px, letter-spacing: 2px
border: 3px solid #0C0C0C, border-radius: 6px
Rotation: -9deg / +5deg / -4deg for visual energy
Yellow: bg #D4A800, text #0C0C0C (dark for contrast)
Teal: bg #0D9970, text #FFFFFF
Orange: bg #C94A00, text #FFFFFF
6.  NEO-BRUTALISM GOLDEN RULES
ZERO gradients — flat solid fills only. No linear-gradient or radial-gradient anywhere.
ZERO blur in shadows — always "5px 5px 0 #0C0C0C" not "5px 5px 8px rgba(...)".
ZERO glassmorphism — no backdrop-filter, no frosted/glass effects.
ZERO floating elements — everything has a visible border. Nothing appears without an outline.
Hard corners default — 0px border-radius on inputs. 6px max on buttons and cards.
Shadow direction: always bottom-right (positive X, positive Y offset).
Hover = LIFT — translate(-x, -y), shadow grows. Element moves toward viewer.
Click = PRESS — translate(+x, +y), shadow shrinks to 0. Element presses down.
ALL caps for labels and badges — letter-spacing 0.5px to 2px depending on element size.
Dark navbar is PERMANENT — never changes color regardless of selected theme.


