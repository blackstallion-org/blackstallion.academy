# BSAH — Equestrian Luxury Color Palette

> **Design direction:** 70% warm, natural, editorial surfaces + 30% dark luxury accents.  
> Inspired by the supplied Black Stallion / equestrian reference images. Hex values are practical digital approximations, not exact pixel samples.

## 1. Palette balance

- **70% — Primary experience:** ivory, parchment, sand, caramel, chestnut, and leather.
- **30% — Accent experience:** charcoal, dark brown, bronze, and antique gold.
- Use the percentages as overall art-direction guidance, not strict pixel or component quotas.
- The site should feel warm, tactile, cinematic, and premium—not like a black website with gold text.

## 2. Core color tokens

| Token | Hex | Intended use |
|---|---|---|
| `ivory` | `#F3EDE2` | Main page backgrounds |
| `parchment` | `#E8DECE` | Alternating section backgrounds |
| `warm-white` | `#FAF7F0` | Cards, forms, elevated light surfaces |
| `sand` | `#DDD0BC` | Subtle panels and neutral accents |
| `sand-border` | `#D4C3AD` | Borders, dividers, input outlines |
| `caramel` | `#B88A62` | Secondary accents, small highlights |
| `chestnut` | `#78472F` | Primary brand color, buttons, links |
| `leather` | `#493126` | Deep brown panels and hover states |
| `dark-brown` | `#30251E` | Primary text on light backgrounds |
| `muted-brown` | `#766252` | Secondary text on light backgrounds |
| `charcoal` | `#171513` | Select dark sections and footer |
| `bronze` | `#8C6745` | Decorative borders and metallic details |
| `antique-gold` | `#C9A66B` | Fine highlights, icons, crest details |

## 3. Palette swatches

### Primary — warm editorial (70%)

| Color | Swatch | Hex |
|---|---|---|
| Ivory | <span style="display:inline-block;width:2em;height:1em;background:#F3EDE2;border:1px solid #999;"></span> | `#F3EDE2` |
| Parchment | <span style="display:inline-block;width:2em;height:1em;background:#E8DECE;border:1px solid #999;"></span> | `#E8DECE` |
| Warm white | <span style="display:inline-block;width:2em;height:1em;background:#FAF7F0;border:1px solid #999;"></span> | `#FAF7F0` |
| Sand | <span style="display:inline-block;width:2em;height:1em;background:#DDD0BC;border:1px solid #999;"></span> | `#DDD0BC` |
| Caramel | <span style="display:inline-block;width:2em;height:1em;background:#B88A62;border:1px solid #999;"></span> | `#B88A62` |
| Chestnut | <span style="display:inline-block;width:2em;height:1em;background:#78472F;border:1px solid #999;"></span> | `#78472F` |
| Leather | <span style="display:inline-block;width:2em;height:1em;background:#493126;border:1px solid #999;"></span> | `#493126` |

### Accent — dark luxury (30%)

| Color | Swatch | Hex |
|---|---|---|
| Charcoal | <span style="display:inline-block;width:2em;height:1em;background:#171513;border:1px solid #999;"></span> | `#171513` |
| Dark brown | <span style="display:inline-block;width:2em;height:1em;background:#30251E;border:1px solid #999;"></span> | `#30251E` |
| Bronze | <span style="display:inline-block;width:2em;height:1em;background:#8C6745;border:1px solid #999;"></span> | `#8C6745` |
| Antique gold | <span style="display:inline-block;width:2em;height:1em;background:#C9A66B;border:1px solid #999;"></span> | `#C9A66B` |

## 4. Recommended semantic mapping

```css
:root {
  /* Main surfaces */
  --color-background: #F3EDE2;
  --color-background-alt: #E8DECE;
  --color-surface: #FAF7F0;
  --color-surface-muted: #DDD0BC;
  --color-border: #D4C3AD;

  /* Typography */
  --color-text: #30251E;
  --color-text-muted: #766252;
  --color-text-on-dark: #F3EDE2;

  /* Brand */
  --color-primary: #78472F;
  --color-primary-hover: #493126;
  --color-secondary: #B88A62;

  /* Luxury accents */
  --color-dark: #171513;
  --color-dark-brown: #30251E;
  --color-bronze: #8C6745;
  --color-gold: #C9A66B;
}
```

## 5. Usage rules

### Backgrounds
- Use `ivory` for the majority of pages.
- Alternate with `parchment` or `warm-white` to create depth.
- Reserve `charcoal` and `leather` for selected cinematic sections, feature panels, and the footer.
- Do not use black as the default background for every section.

### Typography
- Use `dark-brown` for primary text on light surfaces.
- Use `muted-brown` for secondary copy, metadata, and descriptions.
- On dark surfaces, use `ivory` or `warm-white` for readable text.
- Use `antique-gold` for small highlights, not long paragraphs.

### Buttons and links
- Primary button: `chestnut` background with `warm-white` text.
- Primary button hover: `leather` background.
- Secondary button: transparent or `warm-white` background with `chestnut` border and text.
- On dark panels, use `antique-gold` sparingly for focus details or premium actions.

### Borders and texture
- Use `sand-border` for subtle separators.
- Use restrained bronze details for premium dividers, badges, and crest ornamentation.
- Paper grain, leather grain, and image overlays should be very subtle; do not reduce legibility.

### Photography
- Favor authentic equestrian imagery with chestnut and bay horses, leather tack, natural landscapes, stable interiors, and golden-hour light.
- Avoid applying a heavy brown filter to every image.
- Let the natural photographs provide much of the warmth and texture.

## 6. Accessibility and implementation notes

- Check text/background contrast for all actual component states, especially muted text, gold text, and buttons.
- Do not use antique gold as small body text on ivory without verifying contrast.
- Keep keyboard focus indicators visible.
- Define colors as shared design tokens and reuse them consistently rather than hardcoding new colors across individual components.
- Preserve existing routes, content, assets, interactions, backend integrations, and application boundaries when implementing this palette.
- Test desktop, tablet, and mobile layouts after theme changes.

## 7. Quick reference

**Main backgrounds:** `#F3EDE2` · `#E8DECE` · `#FAF7F0`  
**Text:** `#30251E` · `#766252`  
**Brand:** `#78472F` · `#B88A62`  
**Luxury accents:** `#171513` · `#493126` · `#8C6745` · `#C9A66B`

**Design principle:** Warm ivory and natural equestrian tones lead; dark leather, charcoal, bronze, and antique gold provide selective cinematic contrast.
