# Suburb Selection Logic Improvement Plan

## Current Behavior

### Issue Description
When a user specifies suburbs in the `featured_suburbs` configuration array, the npm package (`@mcoster/astro-local-package`) currently includes **all variations** of those suburb names rather than selecting a single best match.

### Example
**Configuration:**
```yaml
featured_suburbs:
  - Salisbury
  - Modbury
```

**Current Output:**
- Salisbury
- Salisbury South
- Salisbury North
- Salisbury Downs
- Modbury
- Modbury North
- Modbury Heights

**Expected Output:**
- Salisbury (single best match)
- Modbury (single best match)

### Current Logic Flow
1. User specifies suburb names in `featured_suburbs` array in `business.yaml`
2. Package reads the featured suburbs list
3. Package searches `suburbs.json` for all suburbs containing the specified name
4. Package includes ALL matching variations
5. All variations are displayed in footer/service areas

## Proposed Solution

### New Selection Logic
When multiple suburb variations match a featured suburb name, select only ONE based on this priority order:

#### Priority 1: Highest Population
- If population data is available in `suburbs.json`
- Select the variation with the highest population
- Rationale: Larger population = more potential customers

#### Priority 2: Simplest Name (Base Name)
- If populations are equal or unavailable
- Prefer the base name without modifiers
- Examples:
  - Choose "Salisbury" over "Salisbury Heights"
  - Choose "Modbury" over "Modbury North"
- Detection: Suburb name exactly matches the search term

#### Priority 3: Shortest Distance from Center
- If multiple suburbs have same population and complexity
- Choose the one closest to the business center location
- Use the distance data already available in suburbs.json

#### Priority 4: Alphabetical
- Final tiebreaker
- Sort alphabetically and take first

### Implementation Plan

#### Step 1: Modify Suburb Matching Function
**File to modify:** Likely in `utils/footer-locations.ts` or similar

```typescript
interface SuburbMatch {
  name: string;
  slug: string;
  population?: number;
  distance?: number;
  isBaseName: boolean;
}

function selectBestSuburbMatch(
  searchTerm: string,
  matches: SuburbMatch[]
): SuburbMatch {
  if (matches.length <= 1) return matches[0];

  // Sort by priority criteria
  return matches.sort((a, b) => {
    // Priority 1: Population (highest first)
    if (a.population && b.population && a.population !== b.population) {
      return b.population - a.population;
    }

    // Priority 2: Base name preference
    if (a.isBaseName !== b.isBaseName) {
      return a.isBaseName ? -1 : 1;
    }

    // Priority 3: Distance (shortest first)
    if (a.distance && b.distance && a.distance !== b.distance) {
      return a.distance - b.distance;
    }

    // Priority 4: Alphabetical
    return a.name.localeCompare(b.name);
  })[0];
}
```

#### Step 2: Update Suburb Processing Logic
```typescript
function processFeaturedSuburbs(
  featuredSuburbs: string[],
  allSuburbs: Suburb[]
): Suburb[] {
  const selectedSuburbs: Suburb[] = [];

  for (const searchTerm of featuredSuburbs) {
    // Find all matches
    const matches = allSuburbs.filter(suburb =>
      suburb.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Map to SuburbMatch format
    const suburbMatches: SuburbMatch[] = matches.map(suburb => ({
      name: suburb.name,
      slug: suburb.slug,
      population: suburb.population,
      distance: suburb.distance,
      isBaseName: suburb.name.toLowerCase() === searchTerm.toLowerCase()
    }));

    // Select best match
    if (suburbMatches.length > 0) {
      const bestMatch = selectBestSuburbMatch(searchTerm, suburbMatches);
      const selectedSuburb = matches.find(s => s.slug === bestMatch.slug);
      if (selectedSuburb) {
        selectedSuburbs.push(selectedSuburb);
      }
    }
  }

  return selectedSuburbs;
}
```

#### Step 3: Add Configuration Option (Optional)
Allow users to choose between behaviors:

```yaml
footer:
  featured_suburbs:
    - Salisbury
    - Modbury
  suburb_selection_mode: "best_match"  # or "all_variations" for backward compatibility
```

### Testing Requirements

#### Test Cases
1. **Single exact match**: "Unley" → Should return "Unley"
2. **Multiple variations**: "Salisbury" → Should return highest population Salisbury variant
3. **Base name exists**: "Modbury" → Should return "Modbury" not "Modbury Heights"
4. **Base name doesn't exist**: "Christie" → Should return highest population variant
5. **No population data**: Should fall back to base name preference
6. **Equal criteria**: Should fall back to alphabetical

#### Expected Results
```yaml
# Input
featured_suburbs:
  - North Adelaide  # Exact match
  - Glenelg        # Might have Glenelg East, Glenelg North
  - Salisbury      # Has many variations
  - Modbury        # Has variations
  - Brighton       # Might have Brighton, Brighton East

# Output (single best matches only)
- North Adelaide  # Exact match
- Glenelg        # Base name selected
- Salisbury      # Highest population or base name
- Modbury        # Base name selected
- Brighton       # Base name selected
```

### Backward Compatibility

To maintain backward compatibility:
1. Add a configuration flag to enable new behavior
2. Default to current behavior if not specified
3. Document the change clearly
4. Provide migration guide

### Files Likely Needing Changes

1. **`utils/footer-locations.ts`** - Main logic for selecting suburbs
2. **`utils/footer-data.ts`** - Footer data processing
3. **`components/Footer.astro`** - Component that renders suburbs
4. **`components/ServiceAreas.astro`** - Service areas component
5. **Type definitions** - Update interfaces for new fields

### Benefits

1. **More Control**: Users get exactly what they specify
2. **Cleaner Display**: Avoid cluttered footer with too many variations
3. **Better SEO**: Focus on main suburb names
4. **Predictable Behavior**: Clear rules for selection
5. **Flexibility**: Can still include variations by listing them explicitly

### Migration Guide for Users

```yaml
# Old behavior (implicit variations)
featured_suburbs:
  - Salisbury  # Would include all Salisbury variations

# New behavior (explicit control)
featured_suburbs:
  - Salisbury         # Only Salisbury
  - Salisbury North   # Explicitly add if wanted
  - Salisbury Downs   # Explicitly add if wanted
```

### Timeline

1. **Phase 1**: Implement selection logic (2-3 hours)
2. **Phase 2**: Add tests (1-2 hours)
3. **Phase 3**: Update documentation (1 hour)
4. **Phase 4**: Test with real projects (1-2 hours)
5. **Phase 5**: Release with version bump

### Notes for Implementation

- Consider caching the selection results for performance
- Log the selection process in debug mode for transparency
- Ensure the logic handles edge cases (empty strings, null values)
- Consider making the priority order configurable
- Document the behavior clearly in the package README

### Example Debug Output

```javascript
console.log(`[Footer] Processing featured suburb: "Salisbury"`);
console.log(`[Footer] Found 4 matches: Salisbury, Salisbury North, Salisbury South, Salisbury Downs`);
console.log(`[Footer] Selected "Salisbury" (reason: base name match)`);
```

This will help users understand why certain suburbs are selected and debug any issues.