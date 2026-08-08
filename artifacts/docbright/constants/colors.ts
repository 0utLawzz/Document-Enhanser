/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#0b1f33',
    tint: '#1777c9',

    // Core surfaces
    background: '#f7f9fc',
    foreground: '#0b1f33',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#0b1f33',

    // Primary action color (buttons, links, active states)
    primary: '#1777c9',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e9f2fb',
    secondaryForeground: '#0b1f33',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#edf1f6',
    mutedForeground: '#6c7d90',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#e7f2ff',
    accentForeground: '#0b1f33',

    // Destructive actions (delete, error states)
    destructive: '#d85050',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#dfe7ef',
    input: '#d5e0eb',
    success: '#238b68',
    warning: '#c7802e',
  },

  dark: {
    text: '#f2f6fa',
    tint: '#62b7ff',
    background: '#0d1824',
    foreground: '#f2f6fa',
    card: '#142435',
    cardForeground: '#f2f6fa',
    primary: '#55aef2',
    primaryForeground: '#082039',
    secondary: '#1a3145',
    secondaryForeground: '#f2f6fa',
    muted: '#1a2b3c',
    mutedForeground: '#a7b8c8',
    accent: '#153b5b',
    accentForeground: '#eaf5ff',
    destructive: '#ff7777',
    destructiveForeground: '#240c0c',
    border: '#263e53',
    input: '#2a455d',
    success: '#64c89e',
    warning: '#e8ac58',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
