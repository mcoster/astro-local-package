# Required Updates for @mcoster/astro-local-package

## Problem Summary
The npm package components are not processing template variables (e.g., `{{businessName}}`, `{{mainLocation}}`), causing these placeholders to appear literally in the rendered HTML instead of being replaced with actual values.

## Components That Need Updates

### 1. WhyUs Component (`src/components/WhyUs.astro`)
**Issue:** When loading data from YAML files that contain template variables, the component displays the raw template strings instead of processing them.

**Current Behavior:**
- Loads `heading` from `why-choose.yaml` files
- Displays raw string like "Why Choose {{businessName}}?" without processing

**Required Fix:**
- Import and use the TemplateProcessor from `../utils/template-processor`
- Process the heading and reasons data after loading from YAML
- Accept optional template data as props for processing

### 2. HeroWithForm Component (`src/components/HeroWithForm.astro`)
**Issue:** Displays template variables in title and subtitle without processing them.

**Current Behavior:**
- Accepts title and subtitle as props
- Displays them directly without processing template variables

**Required Fix:**
- Import and use the TemplateProcessor
- Process title and subtitle props if they contain template variables
- Accept optional template data as props for processing

### 3. ServiceAreas Component (`src/components/ServiceAreas.astro`)
**Status:** ✅ Already correctly accepts heading and subtitle as props. The hardcoded values were in our configuration files, which have been fixed.

## Implementation Details

### TemplateProcessor Integration
The npm package already has a `template-processor.ts` utility at `src/utils/template-processor.ts`. Components need to:

1. Import the TemplateProcessor class
2. Accept template data as optional props
3. Process any strings that might contain template variables before rendering

### Example Implementation for WhyUs Component

```typescript
// Add to imports
import { TemplateProcessor } from '../utils/template-processor';
import { siteConfig } from '../config/site';

// Add to Props interface
templateData?: Record<string, any>;

// In the component logic, after loading YAML data:
const processor = new TemplateProcessor({
  businessName: siteConfig.businessName,
  mainLocation: siteConfig.mainLocation,
  phone: siteConfig.phone,
  formattedPhone: siteConfig.formattedPhone,
  email: siteConfig.email,
  ...templateData // Allow override from props
});

// Process the heading
if (heading) {
  heading = processor.processString(heading);
}

// Process reasons
if (reasons) {
  reasons = processor.process(reasons);
}
```

## Testing Requirements

After updating the npm package:

1. **WhyUs Component:** Should display "Why Choose Brisbane Roof Cleaning Pros?" instead of "Why Choose {{businessName}}?"
2. **HeroWithForm Component:** Should display actual location names instead of {{mainLocation}} placeholders
3. **All template variables:** Should be replaced with actual values from business.yaml configuration

## Package Update Process

1. Navigate to `/Users/mcoster/code/astro-local-package`
2. Make the required component updates
3. Test locally by linking the package
4. Publish new version to npm
5. Update the Brisbane site to use the new version

## Configuration Values to Use

The template processor should use these values from `siteConfig`:
- `businessName`: "Brisbane Roof Cleaning Pros"
- `mainLocation`: "Brisbane"
- `phone`: "(07) 3132 0159"
- `formattedPhone`: "0731320159"
- `email`: "info@brisbaneroofcleaningpros.com.au"
- `serviceRadius`: "35"

These values come from the site's `config/business.yaml` file and are available through the `siteConfig` object in the npm package.