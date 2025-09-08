# Auto-Update Setup for Dependent Sites

This npm package is configured to automatically trigger updates in dependent sites when new versions are published.

## How It Works

1. **Package Update**: When changes are pushed to the `main` branch of this package
2. **Version Bump**: The GitHub workflow automatically bumps the version and publishes
3. **Dispatch Events**: After publishing, the workflow sends repository dispatch events to configured sites
4. **Site Updates**: Each site's workflow receives the event, updates the package, tests the build, and commits if successful
5. **Auto Deploy**: The commit triggers automatic deployment on platforms like Netlify

## Setup for New Sites

To enable auto-updates for a new site:

### 1. Add the site to the dispatch list

Edit `.github/workflows/publish.yml` and add a new dispatch step:

```yaml
- name: Trigger YOUR-SITE-NAME update
  if: env.VERSION != ''
  uses: peter-evans/repository-dispatch@v2
  with:
    token: ${{ secrets.DISPATCH_TOKEN || secrets.GITHUB_TOKEN }}
    repository: mcoster/YOUR-SITE-REPO
    event-type: package-update
    client-payload: '{"package": "@mcoster/astro-local-package", "version": "${{ env.VERSION }}"}'
```

### 2. Add the update workflow to the site

Create `.github/workflows/update-package.yml` in the site repository with the workflow from this repository's examples.

### 3. (Optional) Add Personal Access Token

If updating private repositories, create a Personal Access Token with `repo` scope and add it as `DISPATCH_TOKEN` secret in this repository's settings.

## Locking a Site to a Specific Version

To prevent a site from auto-updating:

1. **Option 1**: Don't add the update workflow to that site
2. **Option 2**: Change the package.json to use a specific version tag:
   ```json
   "@mcoster/astro-local-package": "github:mcoster/astro-local-package#v1.0.7"
   ```

## Manual Updates

Sites can also be updated manually:

1. Via GitHub Actions UI: Go to Actions → "Update NPM Package" → Run workflow
2. Via command line: `npm update @mcoster/astro-local-package`

## Rollback on Failure

If a build fails:
- Netlify keeps the current live site unchanged
- The failed update commit stays in git history
- To fix: Either fix the package issue or revert the package-lock.json commit

## Monitoring

- Check GitHub Actions tab for workflow runs
- Failed updates will show as failed workflows
- Successful updates trigger Netlify deployments automatically