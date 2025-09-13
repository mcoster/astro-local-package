# NPM Package Fix Required: @mcoster/astro-local-package

## Issue Summary
The npm package `@mcoster/astro-local-package` contains hardcoded import paths that reference local project directories instead of being self-contained. This prevents the package from working correctly when installed as a dependency.

## Critical Issue

### Location: `node_modules/@mcoster/astro-local-package/src/utils/component-registry.ts`

**Problem:** The component-registry.ts file is trying to import components from the consuming project's local directories using paths like `@/components/HeroWithForm.astro`.

**Error Message:**
```
Cannot find module '@/components/HeroWithForm.astro' imported from
'/Users/mcoster/code/brisbane-roof-cleaning-pros/node_modules/@mcoster/astro-local-package/src/utils/component-registry.ts'
```

## Root Cause Analysis

The package's `component-registry.ts` is designed to work from within a project's source code (as a local file), not as an external npm package. When it was moved to the package, the import paths were not updated to be package-relative.

## Required Fixes

### 1. **Fix Component Registry Imports**

The component-registry.ts file needs to import components from within the package, not from the consuming project.

**Current (Broken):**
```typescript
// In @mcoster/astro-local-package/src/utils/component-registry.ts
import HeroWithForm from '@/components/HeroWithForm.astro';
import CTABanner from '@/components/CTABanner.astro';
// etc...
```

**Should Be:**
```typescript
// In @mcoster/astro-local-package/src/utils/component-registry.ts
import HeroWithForm from '../components/HeroWithForm.astro';
import CTABanner from '../components/CTABanner.astro';
// etc...
```

### 2. **Review All Package Files for Similar Issues**

Check all files in the package for similar problems:
- Any imports using `@/lib/...` should be `./...` or `../utils/...`
- Any imports using `@/components/...` should be `../components/...`
- Any imports using `@/config/...` should reference the consuming project's config properly

### 3. **Files That May Need Review**

Based on the cleanup work done, these package files may have similar issues:
- `src/utils/component-registry.ts` - CONFIRMED HAS ISSUES
- `src/utils/page-renderer.ts` - May reference component-registry
- `src/utils/location-builder.ts` - May reference project-specific paths
- `src/utils/static-suburbs.ts` - May try to import from project's data folder
- Any component files that import from other components

## How to Fix in the Package

1. **Clone/checkout the package repository**
   ```bash
   git clone [package-repo-url]
   cd astro-local-package
   ```

2. **Search for problematic imports**
   ```bash
   # Find all imports starting with @/
   grep -r "from ['\"]\@/" src/

   # Find all imports referencing src/lib
   grep -r "from ['\"].*src/lib" src/

   # Find all imports referencing src/components
   grep -r "from ['\"].*src/components" src/
   ```

3. **Update all imports to be package-relative**
   - Replace `@/components/` with `../components/`
   - Replace `@/lib/` with `./` or `../utils/`
   - Replace `@/utils/` with `./` (if in utils folder)
   - Replace any absolute project paths with relative package paths

4. **Special Cases to Handle**

   **For project-specific imports (like config):**
   - These should be passed as parameters/props
   - Or imported dynamically
   - Or made optional with defaults

   **For suburbs.json data:**
   - The package should not directly import project data files
   - Should accept data as parameters or read from a known location

5. **Test the changes**
   ```bash
   # Build the package
   npm run build

   # Link locally for testing
   npm link

   # In a test project
   npm link @mcoster/astro-local-package
   npm run dev
   ```

## Additional Recommendations

### 1. **Package Structure Best Practices**

The package should be completely self-contained:
- All components should be in the package's `src/components/`
- All utilities should be in the package's `src/utils/`
- No imports should reference the consuming project's directories

### 2. **Configuration Handling**

Instead of importing config directly, the package should:
- Accept configuration as props/parameters
- Use a configuration provider pattern
- Have sensible defaults for all configuration

### 3. **Data Handling**

For location data (suburbs.json):
- The package should not assume file locations
- Should accept data as parameters
- Or provide a function that the consuming project calls with the data path

## Testing Checklist

After fixes are applied:
- [ ] Package builds without errors
- [ ] No imports use `@/` prefix (except in consuming project)
- [ ] All components can be imported from the package
- [ ] `component-registry.ts` works correctly
- [ ] `page-renderer.ts` can find and render components
- [ ] Location-based features work with provided data
- [ ] Package works in a fresh Astro project

## Impact

Once these fixes are applied:
1. The Brisbane Roof Cleaning Pros site will work correctly
2. The package can be used as a true npm dependency
3. New projects can be created by just installing the package
4. No need for local file duplication

## Priority

**HIGH** - The package is currently unusable as an npm dependency due to these import issues.

---

**Created:** 2025-01-14
**Context:** After cleanup of Brisbane Roof Cleaning Pros project removed local duplicate files