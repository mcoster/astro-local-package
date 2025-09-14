# Fix Featured Suburbs Bug in @mcoster/astro-local-package

## Issue Description

When users configure `featured_suburbs` in their `business.yaml` file, the footer doesn't display all specified suburbs correctly. Instead of showing the manually selected suburbs, it either shows fewer suburbs or falls back to the smart selection algorithm.

### Example Configuration
```yaml
footer:
  featured_suburbs: [
    "Surfers Paradise",
    "Broadbeach",
    "Southport",
    "Main Beach",
    "Robina",
    # ... etc
  ]
```

**Expected:** All 15 specified suburbs should appear in the footer
**Actual:** Only ~11 suburbs appear, and some specified suburbs are missing

## Root Cause Analysis

The bug is in `/src/utils/footer-locations.ts` at line 385, which calls:
```typescript
const suburbs = await getSuburbsByName(manualSuburbs as string[]);
```

However, the `getSuburbsByName` function **does not exist** in the static-suburbs module (`/src/utils/static-suburbs.ts`). The static-suburbs module only exports:
- `getSuburbsWithinRadius`
- `getSuburbsWithPopulation`
- `testConnection`
- `closePool`
- `geocodeAddress`

When the code tries to call the non-existent function, it likely returns an empty array or causes a runtime error that's silently caught, causing the footer to show incorrect suburbs.

## Impact

1. **User Experience:** Users cannot customize which suburbs appear in their footer for SEO/marketing purposes
2. **SEO Impact:** Important service areas may not be prominently displayed
3. **Configuration Confusion:** The `featured_suburbs` setting appears broken even though users have configured it correctly

## Solution Implementation

Add the missing `getSuburbsByName` function to `/src/utils/static-suburbs.ts`:

```typescript
/**
 * Get suburbs by name with fuzzy matching support
 * @param names Array of suburb names to search for
 * @returns Array of matching suburbs with population data
 */
export async function getSuburbsByName(names: string[]): Promise<SuburbWithPopulation[]> {
  const suburbs = loadSuburbs();
  const matched: SuburbWithPopulation[] = [];

  for (const searchName of names) {
    // Normalize the search name (trim, lowercase)
    const normalizedSearch = searchName.trim().toLowerCase();

    // Try exact match first (case-insensitive)
    let suburb = suburbs.find(s =>
      s.name.toLowerCase() === normalizedSearch
    );

    // If no exact match, try starts-with match
    // This handles cases like "Robina" matching "Robina", "Robina Quays", "Robina Woods", etc.
    if (!suburb) {
      suburb = suburbs.find(s =>
        s.name.toLowerCase().startsWith(normalizedSearch)
      );
    }

    // If still no match, try contains match
    // This handles cases like "Burleigh" matching "Burleigh Heads", "West Burleigh", etc.
    if (!suburb) {
      suburb = suburbs.find(s =>
        s.name.toLowerCase().includes(normalizedSearch)
      );
    }

    // If still no match, try removing common suffixes and prefixes
    if (!suburb) {
      const cleanedSearch = normalizedSearch
        .replace(/^(north|south|east|west|upper|lower|new|old)\s+/, '')
        .replace(/\s+(north|south|east|west|heads|waters|beach|park|heights|hills|valley|creek|bay|point|grove|woods|quays|lakes|gardens|downs|ridge|fields)$/, '');

      suburb = suburbs.find(s => {
        const cleanedName = s.name.toLowerCase()
          .replace(/^(north|south|east|west|upper|lower|new|old)\s+/, '')
          .replace(/\s+(north|south|east|west|heads|waters|beach|park|heights|hills|valley|creek|bay|point|grove|woods|quays|lakes|gardens|downs|ridge|fields)$/, '');
        return cleanedName === cleanedSearch;
      });
    }

    if (suburb) {
      // Add the suburb if not already in results (avoid duplicates)
      if (!matched.find(m => m.id === suburb.id)) {
        matched.push(suburb as SuburbWithPopulation);
      }
    } else {
      console.warn(`Suburb not found in database: "${searchName}"`);
    }
  }

  console.log(`Found ${matched.length} of ${names.length} requested suburbs`);
  return matched;
}
```

### Alternative: Using the `locations.ts` (Dynamic) Module

If using the PostGIS database connection, add the same function to `/src/utils/locations.ts`:

```typescript
export async function getSuburbsByName(names: string[]): Promise<SuburbWithPopulation[]> {
  const pool = await getPool();

  // Build a query with case-insensitive matching
  const placeholders = names.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    SELECT
      id,
      name,
      postcode,
      state,
      latitude,
      longitude,
      population,
      population_density as "populationDensity",
      area_sq_km as "areaSqKm"
    FROM suburbs
    WHERE LOWER(name) = ANY(ARRAY[${placeholders}]::text[])
       OR name ILIKE ANY(ARRAY[${placeholders}]::text[])
    ORDER BY
      CASE
        WHEN LOWER(name) = ANY(ARRAY[${placeholders}]::text[]) THEN 0
        ELSE 1
      END,
      population DESC NULLS LAST
  `;

  // Convert names to lowercase and add wildcard patterns
  const params = names.flatMap(name => [
    name.toLowerCase(),
    `${name}%`
  ]);

  try {
    const result = await pool.query(query, params);
    return result.rows as SuburbWithPopulation[];
  } catch (error) {
    console.error('Error fetching suburbs by name:', error);
    return [];
  }
}
```

## Testing Instructions

1. **Update the package** in your test project:
   ```bash
   npm update @mcoster/astro-local-package
   ```

2. **Configure featured suburbs** in `config/business.yaml`:
   ```yaml
   footer:
     featured_suburbs: [
       "Surfers Paradise",
       "Broadbeach",
       "Robina",  # Test exact match
       "Burleigh",  # Test partial match to "Burleigh Heads"
       "Hope Island"  # Test exact match
     ]
   ```

3. **Run the dev server** and check console output:
   ```bash
   npm run dev
   ```

   Expected console output:
   ```
   Using manual footer suburbs: Surfers Paradise, Broadbeach, Robina, Burleigh, Hope Island
   Found 5 of 5 requested suburbs
   ```

4. **Verify footer display**:
   - Check that all specified suburbs appear in the footer
   - Verify the links are correctly formatted
   - Ensure no duplicate suburbs appear

5. **Test edge cases**:
   - Suburbs with variations (e.g., "Robina" should match one of the Robina variants)
   - Suburbs with directional prefixes (e.g., "North Adelaide")
   - Non-existent suburbs (should log warning but not break)

## Migration Notes

### For Package Users
- No migration needed - this is a bug fix that makes existing configuration work correctly
- After updating, your `featured_suburbs` configuration will start working as expected

### For Package Maintainers
- This change is backwards compatible
- The function gracefully handles missing suburbs with console warnings
- The fuzzy matching algorithm prioritizes exact matches, then prefix matches, then contains matches

## Related Files

- `/src/utils/footer-locations.ts` - Calls the function (line 385)
- `/src/utils/static-suburbs.ts` - Needs the function implementation
- `/src/utils/locations.ts` - Also needs the function for database mode
- `/src/components/Footer.astro` - Consumes the footer locations

## Additional Improvements (Optional)

Consider these enhancements for better user experience:

1. **Validation on build**: Add a build-time check that warns if featured suburbs don't match any database entries

2. **Better error messages**: Instead of silently failing, provide clear feedback about which suburbs couldn't be matched

3. **Configuration helper**: Add a CLI command to list all available suburb names for a given service area

4. **Fuzzy matching configuration**: Allow users to configure the strictness of name matching

## Version Requirements

- Package version: 1.0.29+ (after fix is applied)
- No breaking changes
- Backwards compatible with existing configurations