# Auto-Update Setup for Dependent Sites

This npm package supports automatic updates in dependent sites through scheduled GitHub Actions workflows.

## How It Works

1. **Daily Checks**: Sites check for package updates daily at 2 AM
2. **Pull Request Creation**: When updates are found, a PR is automatically created
3. **Build Validation**: The PR includes a test build to ensure compatibility
4. **Auto-merge Option**: PRs can be configured to auto-merge if all checks pass
5. **Manual Review**: Alternatively, PRs can be reviewed manually before merging

## Setup for Client Sites

To enable automatic updates in a client site:

### 1. Add the workflow file

Create `.github/workflows/update-package.yml` in your site repository:

```yaml
name: Check for Package Updates

on:
  schedule:
    # Run daily at 2 AM
    - cron: '0 2 * * *'
  workflow_dispatch:
    inputs:
      auto_merge:
        description: 'Auto-merge PR if tests pass'
        required: false
        default: 'true'
        type: choice
        options:
          - 'true'
          - 'false'

# ... (full workflow in gold-coast-roof-cleaning-pros repository)
```

### 2. Configure auto-merge (optional)

To enable automatic merging of update PRs:
- The workflow includes auto-merge by default for scheduled runs
- Manual runs can choose whether to auto-merge
- PRs will only merge if the build test passes

### 3. Manual trigger

You can also manually check for updates:
1. Go to Actions tab in your repository
2. Select "Check for Package Updates"
3. Click "Run workflow"
4. Choose whether to auto-merge

## Customization Options

### Disable auto-merge

To require manual review of all updates, change the default in the workflow:

```yaml
auto_merge:
  description: 'Auto-merge PR if tests pass'
  required: false
  default: 'false'  # Changed from 'true'
```

### Change schedule

Modify the cron expression to run at different times:

```yaml
schedule:
  - cron: '0 6 * * 1'  # Weekly on Monday at 6 AM
```

### Lock to specific version

To prevent automatic updates, use a specific version in package.json:

```json
"@mcoster/astro-local-package": "github:mcoster/astro-local-package#v1.0.8"
```

## Benefits

- **Safety**: PRs allow review before merging
- **Automation**: Reduces manual update work
- **Visibility**: Clear PR descriptions show what's changing
- **Flexibility**: Can auto-merge or require manual review
- **Testing**: Build validation prevents broken deployments

## Monitoring

- Check the Actions tab for workflow runs
- Review PRs in the Pull Requests tab
- Failed builds will prevent auto-merge
- Netlify will automatically deploy merged PRs

## Rollback

If an update causes issues:
1. Revert the merge commit
2. Or manually downgrade in package.json
3. The site will redeploy with the previous version