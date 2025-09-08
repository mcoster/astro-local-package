# Astro Local Package Workflow

## Overview

This NPM package provides reusable Astro components and utilities for local service provider websites. Client sites can use this package to maintain consistency while allowing for custom overrides.

## Setup for New Sites

### 1. Create New Site

```bash
# Create new Astro site
npm create astro@latest new-client-site
cd new-client-site

# Add required configuration files
echo "@mcoster:registry=https://npm.pkg.github.com" > .npmrc
```

### 2. Install Package

```bash
# Set GitHub token (required for private packages)
export GITHUB_TOKEN="your_github_token"

# Install the package
npm install @mcoster/astro-local-package

# Install other dependencies
npm install @astrojs/sitemap @tailwindcss/vite tailwindcss
```

### 3. Copy Configuration

Copy from an existing site (like adelaide-roof-cleaning-pros):
- `src/config/business.yaml` - Business details
- `.env.example` - Environment variables template
- Content collections in `src/content/`

### 4. Use Components

```astro
---
import Layout from '@mcoster/astro-local-package/layouts/Layout.astro';
import Header from '@mcoster/astro-local-package/components/Header.astro';
import Footer from '@mcoster/astro-local-package/components/Footer.astro';
import Hero from '@mcoster/astro-local-package/components/Hero.astro';
---

<Layout title="Home">
  <Header />
  <Hero title="Welcome" />
  <!-- Your content -->
  <Footer />
</Layout>
```

## Updating the Package

### 1. Make Changes

```bash
cd astro-local-package

# Edit components
# Test locally with npm link if needed
```

### 2. Publish New Version

```bash
# Commit changes
git add .
git commit -m "feat: Add new feature"

# Bump version (patch/minor/major)
npm version patch  # 1.0.1 -> 1.0.2

# Push with tags (triggers auto-publish)
git push && git push --tags
```

### 3. Update Client Sites

```bash
cd client-site

# Check for updates
npm outdated

# Update to latest
export GITHUB_TOKEN="your_github_token"
npm update @mcoster/astro-local-package

# Or install specific version
npm install @mcoster/astro-local-package@1.0.2

# Test and deploy
npm run build
git add package.json package-lock.json
git commit -m "chore: Update template package"
git push
```

## Component Customization

### Using Package Components

Most components should be imported from the package:

```astro
import Header from '@mcoster/astro-local-package/components/Header.astro';
```

### Custom Components

For site-specific components, create them locally:

```astro
---
// src/components/CustomFooter.astro
import Footer from '@mcoster/astro-local-package/components/Footer.astro';
---

<Footer>
  <div slot="extra">
    <!-- Custom content -->
  </div>
</Footer>
```

### Overriding Components

To completely override a package component:

1. Create local component with same functionality
2. Update imports to use local version
3. Document the override reason

## Deployment

### Netlify Setup

1. Add environment variable:
   - Key: `GITHUB_TOKEN`
   - Value: Your GitHub personal access token

2. Ensure `.npmrc` is committed to repository

3. Deploy normally - Netlify will use the token to install the package

### GitHub Actions

For automated deployments, add secret:

```yaml
# .github/workflows/deploy.yml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Version Management

### Semantic Versioning

- **Patch (1.0.x)**: Bug fixes, style tweaks
- **Minor (1.x.0)**: New components, non-breaking features
- **Major (x.0.0)**: Breaking changes, major refactors

### Update Strategy

In client `package.json`:

```json
{
  "dependencies": {
    // Always get patch updates
    "@mcoster/astro-local-package": "~1.0.1",
    
    // Get minor updates too
    "@mcoster/astro-local-package": "^1.0.1",
    
    // Lock to specific version
    "@mcoster/astro-local-package": "1.0.1"
  }
}
```

## Troubleshooting

### Authentication Issues

```bash
# Error: 401 Unauthorized
# Solution: Set GitHub token
export GITHUB_TOKEN="ghp_your_token_here"
```

### Package Not Found

```bash
# Ensure .npmrc exists and contains:
@mcoster:registry=https://npm.pkg.github.com
```

### Build Errors After Update

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Available Components

- `Breadcrumb` - Navigation breadcrumbs
- `BusinessHours` - Business hours display
- `ContactForm` - Contact form with validation
- `ContactInfo` - Contact information block
- `CTABanner` - Call-to-action banner
- `FloatingCTA` - Floating call-to-action button
- `Footer` - Site footer
- `Header` - Site header with navigation
- `Hero` - Hero section
- `HeroWithForm` - Hero with embedded form
- `IconGrid` - Grid of icons with text
- `MapEmbed` - Google Maps embed
- `MarkdownContent` - Render markdown content
- `QuoteForm` - Quote request form
- `RelatedServices` - Related services grid
- `SEO` - SEO meta tags
- `ServiceAreas` - Service areas list
- `ServiceCard` - Service card component
- `ServiceContent` - Service detail content
- `ServiceFAQ` - FAQ accordion
- `ServiceFeatures` - Service features grid
- `ServicesGrid` - Services grid layout
- `SmartImage` - Intelligent image component
- `Spacer` - Vertical spacing
- `TwoColumnSection` - Two-column layout
- `WhyUs` - Why choose us section

## Best Practices

1. **Keep Package Generic**: Don't include business-specific content
2. **Use Slots**: Allow customization through slots
3. **Document Changes**: Update CHANGELOG.md
4. **Test Before Publishing**: Use npm link to test locally
5. **Version Appropriately**: Follow semantic versioning
6. **Communicate Updates**: Notify team of breaking changes

## Support

- Repository: https://github.com/mcoster/astro-local-package
- Issues: https://github.com/mcoster/astro-local-package/issues