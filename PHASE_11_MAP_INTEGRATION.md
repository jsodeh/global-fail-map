# Phase 11: Database Projects Map Integration

## Overview
Integrated admin-created database projects with the public map, allowing them to appear alongside curated static examples. Users can now see all projects (both curated and admin-managed) on a single unified map interface.

## What Was Added

### 1. Map Utilities Module
**Location:** `src/lib/map-utils.ts`

**Purpose:** Convert database projects to map-compatible format

**Key Functions:**

#### `projectToMapExample(project: Project): FailExample`
Converts a database Project to FailExample format for map display.

**Transformation:**
```typescript
{
  id: project.id,                    // UUID from database
  title: project.title,
  subtitle: project.subtitle,
  location: project.locationName,
  country: 'Nigeria',                 // All projects are in Nigeria
  lat/lng: parseFloat(project.lat/lng),
  category: 'infrastructure',         // Default for now
  status: project.status,
  period: formatProjectPeriod(...),   // Formatted date range
  year: extractYear(project),
  summary: extractSummary(...),       // First 200 chars from markdown
  confidence: project.confidence,
  reportPath: '',                     // Not used for DB projects
  sources: [],                        // Loaded separately
}
```

#### `isDatabaseProject(example: FailExample): boolean`
Detects if a project is from database vs static files by checking for UUID-style ID (contains hyphens).

### 2. Enhanced FailAtlas Component
**Location:** `src/components/fail-map/fail-atlas.tsx`

**Changes:**

#### Fetches Database Projects
```typescript
useEffect(() => {
  fetch('/api/projects')
    .then(response => response.json())
    .then(data => {
      const projects = data.projects.map(convertToMapFormat);
      setDbProjects(projects);
    });
}, []);
```

#### Merges Data Sources
```typescript
const allExamples = useMemo(() => 
  [...examples, ...dbProjects], 
  [examples, dbProjects]
);
```

**Benefits:**
- Static curated examples (from `examples.json`)
- + Database projects (from admin dashboard)
- = Single unified map experience

#### Updated Filtering
All filtering, searching, and URL routing now work with combined dataset:
- Search works across both data sources
- Category filters apply uniformly
- Direct links (`?case=uuid`) work for database projects

### 3. Enhanced ReportPanel Component
**Location:** `src/components/fail-map/report-panel.tsx`

**Smart Content Loading:**

```typescript
useEffect(() => {
  const isDatabaseProject = example.id.includes('-');
  
  if (isDatabaseProject) {
    // Fetch from API
    fetch(`/api/projects?search=${example.id}`)
      .then(data => setMarkdown(data.projects[0].reportContent));
  } else {
    // Load from file
    fetch(example.reportPath)
      .then(response => response.text())
      .then(setMarkdown);
  }
}, [example]);
```

**Features:**
- Detects project type automatically
- Loads database projects from API
- Loads static examples from files
- Generates fallback content if reportContent is empty
- Unified display regardless of source

## Data Flow

### Static Examples (Original)
```
examples.json → FailAtlas → AtlasGlobe → Markers
                    ↓
             ReportPanel ← report.md file
```

### Database Projects (New)
```
PostgreSQL → /api/projects → FailAtlas → AtlasGlobe → Markers
                                 ↓
                        ReportPanel ← API (reportContent field)
```

### Unified Experience
```
Both Sources → allExamples[] → Single Map View
                                     ↓
                              User sees everything
```

## Technical Details

### Project Type Detection

**UUID Format:** `550e8400-e29b-41d4-a716-446655440000`
- Contains hyphens
- Indicates database project

**Static Format:** `kandahar-highway`, `theranos-blood-test`
- Slug-style IDs
- Indicates curated example

**Detection Code:**
```typescript
const isDatabaseProject = example.id.includes('-') && 
  example.id.length > 20; // More robust check
```

### Report Content Handling

**Database Projects:**
- Content stored in `reportContent` field (markdown)
- Fetched via `/api/projects` endpoint
- Can be edited in admin dashboard
- Generates basic content if empty

**Static Examples:**
- Content in `/public/reports/*.md` files
- Pre-written, curated reports
- Loaded directly from filesystem

### Status Mapping

Database statuses are capitalized for display:
```typescript
planned → Planned
ongoing → Ongoing
completed → Completed
stalled → Stalled
abandoned → Abandoned
```

### Period Formatting

Formats date ranges intelligently:
- `2020-01-01` to `2023-12-31` → `2020–2023`
- `2020-01-01` to `null` → `2020–present`
- `null` to `2023-12-31` → `Until 2023`
- Both `null` → `Date unknown`

## User Experience

### For Public Users

**What They See:**
1. Open the map (homepage)
2. See markers for ALL projects (curated + database)
3. Click any marker to view details
4. Modal shows project information uniformly
5. Images appear if uploaded (database projects only for now)

**No Visible Distinction:**
- Users don't know/care which projects are database vs static
- Everything looks consistent
- Same modal, same format, same interaction

### For Admins

**Workflow:**
1. Create project in admin dashboard
2. Add details, budgets, status updates
3. Upload images
4. Project automatically appears on public map
5. Users can immediately see and interact with it

**No Deploy Required:**
- Projects appear in real-time
- No rebuild needed
- Instant public visibility

## API Endpoints Used

### `/api/projects` - GET
**Purpose:** Fetch all public projects

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "Second Niger Bridge",
      "lat": "6.1234",
      "lng": "6.7890",
      "state": "Anambra",
      "status": "ongoing",
      "reportContent": "## Overview\n\nProject details...",
      // ... other fields
    }
  ]
}
```

## Benefits

1. **Unified Experience**: All projects in one place
2. **Real-Time Updates**: New projects appear immediately
3. **No Duplication**: Single map shows everything
4. **Consistent UX**: Same interaction for all project types
5. **Scalable**: Easy to add more projects via admin
6. **Transparent**: Public can see government projects instantly

## Future Enhancements

### Category Support
Currently all database projects use `'infrastructure'` category. Could add:
- Map `project.sector` to categories
- Add custom category field in database
- Create sector-to-category mapping

### Enhanced Metadata
Add to ReportPanel sidebar for database projects:
- Tier (Federal/State/LGA)
- MDA (Ministry/Department/Agency)
- State & LGA
- Budget information
- Contractor details

### Filtering
Add public map filters for database projects:
- Filter by state/LGA
- Filter by status
- Filter by sector/tier
- Date range filters

### Markers
Differentiate database vs static projects:
- Different marker colors
- Different icons
- Indicator on map

### Source Display
Load project sources for database projects:
- Fetch from `project_sources` table
- Display in ReportPanel sources section
- Link to external references

## Testing Checklist

- [ ] Create a project in admin dashboard
- [ ] Verify it appears on public map
- [ ] Click the marker and check modal opens
- [ ] Verify project details display correctly
- [ ] Check that images show if uploaded
- [ ] Test search functionality with database project
- [ ] Test direct link (?case=uuid) to database project
- [ ] Verify static examples still work correctly
- [ ] Check filtering works across both data sources
- [ ] Test on mobile, tablet, desktop
- [ ] Verify no performance issues with many projects

## Performance Considerations

**Initial Load:**
- Fetches database projects once on mount
- Combined with static examples (already loaded)
- Single render with merged data

**Optimization:**
- Consider pagination for 100+ projects
- Add loading state while fetching
- Cache database projects in localStorage
- Implement incremental loading

**Current Approach:**
- Loads all projects at once
- Fine for < 1000 projects
- Review if dataset grows significantly

## Migration Path

If needed to add fields to map display:

1. Update database schema
2. Update `/api/projects` response
3. Update conversion in FailAtlas
4. Update ReportPanel display
5. No changes needed to examples.json

Clean separation between data sources allows independent evolution.
