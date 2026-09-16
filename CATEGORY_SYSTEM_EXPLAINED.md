# Category System Documentation

## Overview
The map uses a **category system** that determines:
1. **Icon color and design** for project markers on the map
2. **"Megaprojects" label** shown in the legend/key
3. **Hover card styling** when hovering over markers

## Current Category Types

Located in `src/components/fail-map/types.ts`:

```typescript
export const categories = [
  { id: 'all', label: 'Everything' },
  { id: 'companies', label: 'Companies' },
  { id: 'infrastructure', label: 'Megaprojects' }, // ← What you see
  { id: 'science', label: 'Science' },
  { id: 'technology', label: 'Technology' },
  { id: 'visions', label: 'Visions' },
] as const;
```

### Category Mapping:
- `infrastructure` → Displays as **"Megaprojects"** (orange icon)
- `companies` → Displays as **"Companies"** 
- `science` → Displays as **"Science"**
- `technology` → Displays as **"Technology"**
- `visions` → Displays as **"Visions"**

## Current Problem

### Static Projects (examples.json) ✅
Projects in `src/data/examples.json` have categories defined:
```json
{
  "id": "ajaokuta",
  "title": "Ajaokuta Steel",
  "category": "infrastructure",  // ← Defined here
  ...
}
```
**Result:** Shows correct icon, hover card works, labeled as "Megaprojects"

### Database Projects ❌
Projects from the database are ALL hardcoded to `"infrastructure"`:

**File:** `src/lib/map-utils.ts` (line 18)
```typescript
export function projectToMapExample(project: Project): FailExample {
  return {
    ...
    category: 'infrastructure' as const, // ← HARDCODED! All DB projects = Megaprojects
    ...
  };
}
```

**Result:** All database projects show orange infrastructure icon

## Why Database Projects Lack Categories

The database schema (`src/lib/db/schema.ts`) has **NO category field**:
```typescript
export const projects = pgTable('projects', {
  id: uuid('id'),
  title: text('title').notNull(),
  sector: text('sector').notNull(), // ← Has "sector" (roads, health, power)
  // NO CATEGORY FIELD!
  ...
});
```

The database uses **`sector`** instead (roads, power, health, education, water), which is different from the map's category system.

## Icon & Color System

Icons are defined in `src/components/fail-map/marker-symbol.tsx` and styled in CSS.

Each category has:
- Unique SVG icon shape
- Distinct color scheme
- Hover effects

### Current CSS (example):
```css
.atlas-pin[data-map-category="infrastructure"] {
  --pin-color: #ea580c; /* Orange for infrastructure/Megaprojects */
}

.atlas-pin[data-map-category="technology"] {
  --pin-color: #2563eb; /* Blue for technology */
}
```

## Hover Card System

Hover cards are rendered in `atlas-globe.tsx`:
```typescript
{hovered && !nearby.length && !proposal && !uncharted && (
  <div className="map-hover-card">
    <span className="eyebrow">
      {hovered.location} · {hovered.period}
    </span>
    <strong>{hovered.title}</strong>
    <span className="hover-summary">
      {hovered.subtitle || hovered.status}
    </span>
    <span className="hover-category" data-map-category={hovered.category}>
      <MarkerSymbol category={hovered.category} />
      {categories.find((item) => item.id === hovered.category)?.label}
    </span>
  </div>
)}
```

The hover works when:
1. Project has valid `category` field
2. Project has `subtitle` or descriptive fields
3. Marker is hovered (mouseenter event)

## Solutions to Fix Database Projects

### Option 1: Add Category Field to Database (Recommended)
1. **Add migration** to add `category` column to `projects` table
2. **Update schema** in `src/lib/db/schema.ts`
3. **Update admin form** to allow category selection (dropdown)
4. **Update map-utils** to read from database

### Option 2: Map Sector to Category (Quick Fix)
Map the `sector` field to closest category:
```typescript
function sectorToCategory(sector: string): Category {
  const mapping: Record<string, Category> = {
    'roads': 'infrastructure',
    'power': 'infrastructure',
    'railway': 'infrastructure',
    'health': 'infrastructure',
    'education': 'infrastructure',
    'water': 'infrastructure',
    'technology': 'technology',
    // etc.
  };
  return mapping[sector] || 'infrastructure';
}
```

### Option 3: Use Nigeria-Specific Categories
Create new categories relevant to Nigerian projects:
```typescript
export const categories = [
  { id: 'all', label: 'Everything' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'social', label: 'Social Projects' }, // Health, education
  { id: 'economic', label: 'Economic Development' },
  { id: 'technology', label: 'Technology' },
  { id: 'environment', label: 'Environment' },
] as const;
```

## Recommended Action Plan

### Phase 1: Quick Fix (Immediate)
Map existing `sector` to `category` in `map-utils.ts`:
```typescript
category: sectorToCategory(project.sector),
```

### Phase 2: Proper Implementation (Better)
1. Add `category` field to database
2. Set default based on sector for existing projects
3. Allow admins to select category when creating projects
4. Update all new projects with proper categories

### Phase 3: Enhanced Categories (Optional)
1. Design Nigeria-specific category system
2. Create custom icons for each category
3. Update color scheme to match Nigerian branding

## Files Involved

### Core Files:
- `src/components/fail-map/types.ts` - Category definitions
- `src/lib/map-utils.ts` - Database → Map conversion (PROBLEM HERE)
- `src/lib/db/schema.ts` - Database schema (NO category field)
- `src/components/fail-map/marker-symbol.tsx` - Icon rendering
- `src/components/fail-map/atlas-globe.tsx` - Hover card display

### Styling:
- `src/app/globals.css` - Pin colors and styles
- `src/components/fail-map/report.css` - Modal styling

### Admin:
- `src/app/admin/projects/[id]/page.tsx` - Project edit form
- Would need category selector dropdown

## Testing Checklist

After implementing category system:
- [ ] Database projects show correct category icons
- [ ] Hover cards appear for database projects
- [ ] Category labels display correctly ("Megaprojects" etc.)
- [ ] Legend/key shows all active categories
- [ ] Filter by category works for database projects
- [ ] Existing static projects still work
- [ ] Admin can select category when creating project
- [ ] Category colors match design system

## Color Reference (Nigeria Theme)

Current Nigeria green: `#1a472a`

Suggested category colors:
- Infrastructure: `#ea580c` (Orange) - Current
- Social: `#16a34a` (Green)
- Economic: `#2563eb` (Blue)
- Technology: `#8b5cf6` (Purple)
- Environment: `#059669` (Emerald)

---

**Status:** Category system works for static projects, NOT for database projects.
**Root Cause:** No category field in database + hardcoded "infrastructure" in map-utils.ts
**Priority:** Medium - Affects user experience and project differentiation
