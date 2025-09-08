# @mcoster/astro-local-package

A reusable package of Astro components and utilities for building local service provider websites with automatic updates, smart image handling, and location-based content generation.

**Current Version:** 1.0.5

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
```

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

## Updating the Template

### Automatic Updates

Client sites can automatically check for template updates:

1. The GitHub Action runs daily
2. Creates a PR when updates are available
3. Run tests to ensure compatibility
4. Auto-merge if all checks pass

### Manual Updates

```bash
# Check for updates
npm outdated @mcoster/astro-local-package

# Update to latest version
npm update @mcoster/astro-local-package

# Update to specific version
npm install @mcoster/astro-local-package@1.2.3
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

### Latest Updates (v1.0.5)
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