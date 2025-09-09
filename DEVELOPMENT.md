# Development Workflow

This document outlines the development workflow for the Astro Local Package, particularly focusing on safe feature development using branches.

## Branch Strategy

Since client sites pull directly from Git references, we use a careful branch strategy to ensure stability:

### Main Branch (`main`)
- **Production-ready code only**
- All client sites using `github:mcoster/astro-local-package#main` automatically receive these updates
- Only merge thoroughly tested code
- Consider impacts on ALL client sites before merging

### Feature Branches
- **All development happens in feature branches**
- Naming convention: `feature/description` or `fix/description`
- Test thoroughly before merging to main

### Stable Branch (Optional)
- For sites requiring extra stability, maintain a `stable` branch
- Cherry-pick tested changes from main
- Sites can reference: `github:mcoster/astro-local-package#stable`

## Development Workflow

### 1. Starting New Development

```bash
# Create a feature branch
git checkout -b feature/new-component

# Make your changes
# Test locally with a client site
```

### 2. Testing with Client Sites

#### Local Testing
```bash
# In a client site, temporarily point to your feature branch
# Edit package.json:
"@mcoster/astro-local-package": "github:mcoster/astro-local-package#feature/new-component"

# Install and test
npm install
npm run dev
```

#### Testing Multiple Sites
Before merging to main, test with at least one site from each category:
- Simple site (minimal customization)
- Complex site (heavy customization)
- Recent site (latest patterns)
- Legacy site (older patterns)

### 3. Pre-Merge Checklist

Before merging a feature branch to main:

- [ ] All tests pass
- [ ] Tested with multiple client sites
- [ ] No breaking changes (or migration documented)
- [ ] Documentation updated if needed
- [ ] Consider impact on ALL production sites

### 4. Merging to Main

```bash
# Ensure your branch is up to date
git checkout main
git pull origin main
git checkout feature/new-component
git rebase main

# Merge (prefer merge commits for feature branches)
git checkout main
git merge --no-ff feature/new-component
git push origin main

# Tag if significant release
git tag v1.0.14
git push origin v1.0.14
```

### 5. Emergency Rollback

If a bad change makes it to main:

```bash
# Immediate fix: revert the merge
git revert -m 1 <merge-commit-hash>
git push origin main

# Sites will get the revert on next build
```

## Breaking Changes

### Avoiding Breaking Changes

Since sites auto-update, avoid breaking changes when possible:
- Add new props/options without removing old ones
- Deprecate features before removing
- Provide fallbacks and migrations

### When Breaking Changes Are Necessary

1. **Create a migration branch first**
   ```bash
   git checkout -b migration/v2-prep
   ```

2. **Add compatibility layer**
   - Support both old and new patterns
   - Add deprecation warnings

3. **Communicate with site owners**
   - Document the change
   - Provide migration timeline
   - Consider using a new major version branch

4. **Staged rollout**
   ```
   main → includes compatibility layer
   v2 → new branch with breaking changes
   ```
   
   Sites can opt-in by changing their reference:
   ```json
   "@mcoster/astro-local-package": "github:mcoster/astro-local-package#v2"
   ```

## Version Management

Even though we use Git references, we still maintain version numbers for:
- Release tracking
- Changelog generation
- Emergency rollback points

### Version Bumping

The publish workflow automatically bumps versions:
- `fix:` commits → patch version
- `feat:` commits → minor version (manually)
- Breaking changes → major version (manually)

### Tagging Releases

```bash
# After significant changes
git tag v1.0.14 -m "Add new Hero component variant"
git push origin v1.0.14
```

## Best Practices

### 1. Commit Messages
Use conventional commits for automatic version bumping:
- `fix: correct button alignment issue`
- `feat: add new testimonial component`
- `docs: update README with new options`
- `chore: update dependencies`

### 2. Small, Focused Changes
- One feature per branch
- Easier to test and rollback
- Clearer impact assessment

### 3. Progressive Enhancement
- New features should enhance, not break
- Provide sensible defaults
- Make new features opt-in when possible

### 4. Communication
- Document significant changes in README
- Use GitHub Issues for tracking
- Consider a CHANGELOG.md for major updates

## Testing Strategy

### Local Development
```bash
# Link package locally for development
cd astro-local-package
npm link

cd ../client-site
npm link @mcoster/astro-local-package
```

### Automated Testing
Consider adding:
- Component tests
- Build tests for sample sites
- Visual regression tests

### Manual Testing Checklist
- [ ] Components render correctly
- [ ] Styles apply properly
- [ ] Build succeeds
- [ ] No console errors
- [ ] Responsive design works
- [ ] Accessibility maintained

## Troubleshooting

### Site Not Getting Updates
```bash
# Force update in client site
rm -rf node_modules package-lock.json
npm install
```

### Testing Specific Commit
```json
"@mcoster/astro-local-package": "github:mcoster/astro-local-package#commit-hash"
```

### Checking What Sites Are Using
Sites using `#main` get automatic updates.
Sites using `#v1.0.13` stay on that version.
Sites using `#feature/branch` get that branch.

## Questions?

For questions about this workflow, please open an issue in the repository.