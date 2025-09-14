# @mcoster/astro-local-package

A reusable package of Astro components and utilities for building local service provider websites with automatic updates, smart image handling, and location-based content generation.

**Current Version:** 1.0.29

## Features

- 🚀 **Pre-built Components**: Hero sections, service grids, contact forms, and more
- 🖼️ **Smart Image System**: Automatic image matching and optimization
- 📍 **Location Pages**: Dynamic generation for service areas
- 🎨 **Tailwind CSS v4**: Modern styling with custom configurations
- 🔄 **Automatic Updates**: Keep client sites in sync with template improvements
- 📱 **Fully Responsive**: Mobile-first design approach
- 🔍 **SEO Optimized**: Built-in meta tags and sitemap generation

## Installation

### Option 1: Using GitHub Directly (Recommended)

Install directly from GitHub repository (no authentication required):

```bash
npm install github:mcoster/astro-local-package#main
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "@mcoster/astro-local-package": "github:mcoster/astro-local-package#main"
  }
}
```

### Option 2: Using NPM Registry

1. Create a `.npmrc` file in your project root:

```bash
@astro-local:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Set your GitHub token as an environment variable:

```bash
export GITHUB_TOKEN=your_github_personal_access_token
```

3. Install the package:

```bash
npm install @mcoster/astro-local-package
```

## Quick Start

### Create a New Site

```bash
# Clone the client site template
git clone https://github.com/mcoster/astro-local-client-template my-client-site
cd my-client-site

# Install dependencies
npm install

# Configure your business details
cp config/business.example.yaml config/business.yaml
# Edit config/business.yaml with your client's information

# Start development server
npm run dev
```

### Project Structure

```
my-client-site/
├── config/
│   └── business.yaml          # Business configuration
├── business-images/            # Client-specific images
│   ├── pending/               # Upload new images here
│   ├── approved/              # Processed images
│   └── stock/                 # Downloaded stock photos
├── src/
│   ├── pages/                 # Site pages
│   └── content/               # Custom content
├── public/                    # Static assets
└── package.json               # Dependencies
```

## Using Components

All template components are available through the package:

```astro
---
// In your .astro files
import Layout from '@mcoster/astro-local-package/layouts/Layout.astro';
import Hero from '@mcoster/astro-local-package/components/Hero.astro';
import ServicesGrid from '@mcoster/astro-local-package/components/ServicesGrid.astro';
---

<Layout title="Home">
  <Hero />
  <ServicesGrid />
</Layout>
```

## Available Components

### Layout Components
- `Layout` - Base layout with header/footer
- `PageLayout` - Standard page layout

### Section Components
- `Hero` - Hero section with CTA
- `HeroWithForm` - Hero with embedded quote form
- `ServicesGrid` - Service cards grid
- `ServiceAreas` - Location coverage display
- `WhyUs` - Benefits/features section
- `CTABanner` - Call-to-action banner
- `ContactInfo` - Contact details section

### UI Components
- `SmartImage` - Intelligent image loading
- `Header` - Site navigation
- `Footer` - Site footer
- `ContactForm` - Contact form
- `QuoteForm` - Quote request form
- `ServiceCard` - Service display card
- `Breadcrumb` - Navigation breadcrumbs
- `SEO` - Meta tags component

## Configuration

### business.yaml

Configure your client's business details:

```yaml
business:
  name: Your Business Name
  logo: /images/logo.png
  tagline: Your Business Tagline
  phone: (08) 1234 5678
  email: info@example.com
  
address:
  street: 123 Main St
  city: Adelaide
  state: SA
  postcode: "5000"
  
service:
  main_category: Your Service
  main_location: Adelaide
  radius_km: 30
  
colors:
  primary: 1E40AF
  secondary: 059669
  accent: DC2626
  cta: FF6B35

footer:
  featured_suburbs:
    - Salisbury         # Shows single best match by default
    - Modbury
    - Burleigh         # Will match "Burleigh Heads" with improved matching
  suburb_selection_mode: best_match  # or 'all_variations' to show all matches
  suburb_limit: 15                   # Optional: limit number of suburbs displayed
  auto_supplement: false              # Optional: disable auto-adding suburbs (default: true)
```

### Footer Suburb Selection

The footer displays service area suburbs with flexible configuration options:

#### Configuration Options (v1.0.29+)

```yaml
footer:
  featured_suburbs: ["Surfers Paradise", "Broadbeach", "Robina"]

  # Selection mode for handling multiple matches
  suburb_selection_mode: best_match  # Default: 'best_match'
  # Options:
  # - 'best_match': Shows single best match per suburb name
  # - 'all_variations': Shows all matching variations

  # Maximum suburbs to display (optional)
  suburb_limit: 20  # No default limit

  # Auto-supplement with smart selection if fewer than 11 suburbs
  auto_supplement: true  # Default: true
```

#### Key Features (v1.0.29)

1. **No radius restriction** - Featured suburbs can be outside your service radius
2. **No forced limits** - Display exactly the number of suburbs you specify
3. **Duplicate prevention** - Same suburb won't appear twice
4. **Better matching** - "Burleigh" now correctly matches "Burleigh Heads"
5. **Flexible display** - Show 5, 11, 15, or any number of suburbs

#### Selection Modes

**Best Match Mode (default):**
```yaml
featured_suburbs: ["Salisbury"]
suburb_selection_mode: best_match
# Result: Shows only "Salisbury" (or best variant if base doesn't exist)
```

**All Variations Mode:**
```yaml
featured_suburbs: ["Salisbury"]
suburb_selection_mode: all_variations
# Result: Shows Salisbury, Salisbury North, Salisbury South, etc.
```

#### Migration from v1.0.28

- **Default behavior change**: Manual suburbs no longer auto-supplement to 11 unless `auto_supplement: true`
- **To restore v1.0.28 behavior**: Leave `auto_supplement` as default (true)
- **To disable auto-supplementing**: Set `auto_supplement: false`

## Image Processing

The template includes an intelligent image system:

```bash
# Process client images
npm run images:process

# Individual commands
npm run images:manifest    # Scan for required images
npm run images:analyze     # AI analysis of images
npm run images:match       # Match to website sections
npm run images:fetch-stock # Download stock photos
```

Place client images in `business-images/pending/` and run the processing pipeline.

## Package Installation & Updates

### Installation Method: Git References (Recommended)

Client sites use Git references to automatically stay up-to-date with the package:

```json
{
  "dependencies": {
    "@mcoster/astro-local-package": "github:mcoster/astro-local-package#main"
  }
}
```

#### Why Git References?

We use Git references instead of versioned packages for several key reasons:

1. **Zero Authentication Issues**: GitHub Package Registry requires authentication even for public packages. Git references work seamlessly with the default `GITHUB_TOKEN` in GitHub Actions.

2. **Truly Hands-Off Updates**: Sites automatically get the latest updates when they rebuild on platforms like Netlify, without any manual intervention.

3. **No Token Management**: No need to create, store, or rotate Personal Access Tokens (PATs) for each new site.

4. **Programmatic Simplicity**: New sites can be created programmatically without configuring authentication secrets.

#### The Tradeoff

The main tradeoff is less granular version control. However, this is mitigated through:
- Careful branch management in the package repository
- Feature branches for development
- Optional use of stable branches for production sites

### Alternative Installation Methods

#### For Production Sites Requiring Version Pinning

Use a specific Git tag:

```json
{
  "dependencies": {
    "@mcoster/astro-local-package": "github:mcoster/astro-local-package#v1.0.13"
  }
}
```

#### For Development/Testing

Use a feature branch:

```json
{
  "dependencies": {
    "@mcoster/astro-local-package": "github:mcoster/astro-local-package#feature/new-component"
  }
}
```

## Customization

### Extending Components

Create local components that extend template components:

```astro
---
// src/components/CustomHero.astro
import Hero from '@mcoster/astro-local-package/components/Hero.astro';

// Add custom props or logic
---

<Hero class="custom-hero">
  <slot />
</Hero>

<style>
  .custom-hero {
    /* Custom styles */
  }
</style>
```

### Override Styles

Use Tailwind CSS to customize appearance:

```css
/* src/styles/custom.css */
@import '@mcoster/astro-local-package/styles/base.css';

/* Your custom styles */
.hero {
  @apply bg-blue-600;
}
```

## Versioning

We use semantic versioning:

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backwards compatible
- **Patch** (0.0.X): Bug fixes

Configure version acceptance in package.json:

```json
{
  "dependencies": {
    "@mcoster/astro-local-package": "^1.0.0"  // Accept minor and patch updates
  }
}
```

## Migration Guide

### From Standalone to Package

1. Install the package
2. Update import paths in your pages
3. Move custom components to local src/
4. Update configuration files
5. Test thoroughly

Example migration:

```diff
---
- import Layout from '../layouts/Layout.astro';
- import Hero from '../components/Hero.astro';
+ import Layout from '@mcoster/astro-local-package/layouts/Layout.astro';
+ import Hero from '@mcoster/astro-local-package/components/Hero.astro';
---
```

## API Reference

### Utilities

```typescript
import { 
  loadConfig,
  processTemplate,
  generateLocations 
} from '@mcoster/astro-local-package/utils';

// Load business configuration
const config = await loadConfig();

// Process template with variables
const content = processTemplate(template, variables);

// Generate location pages
const locations = await generateLocations(config);
```

## Troubleshooting

### Common Issues

**Package not found**
- Ensure `.npmrc` is configured correctly
- Check GitHub token has `read:packages` permission

**Components not rendering**
- Verify import paths are correct
- Check Astro version compatibility

**Images not loading**
- Run `npm run images:process`
- Check image paths in manifest.json

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes.

### Latest Updates (v1.0.29)
- **Fixed featured suburbs**: Now correctly fetches ALL specified suburbs, even outside service radius
- **Flexible display**: No more forced 11 suburb limit - show exactly what you specify
- **Improved matching**: "Burleigh" now matches "Burleigh Heads" correctly
- **Duplicate prevention**: Suburbs can't appear twice in the footer
- **New configuration options**: Control selection mode, limits, and auto-supplementing
- **Backward compatible**: Default settings maintain v1.0.28 behavior

### Previous Updates (v1.0.5)
- Fixed footer duplicate location links issue
- Improved location filtering logic
- Better handling of main location in footer

## License

MIT License - See LICENSE file for details

## Support

- GitHub Issues: [Report bugs](https://github.com/mcoster/astro-local-package/issues)
- Example Implementation: [astro-local-template](https://github.com/mcoster/astro-local-template)
- Documentation: [Full docs](https://docs.example.com)
- Email: support@example.com