# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.29] - 2025-09-14

### Added
- New configuration options for footer suburbs:
  - `suburb_selection_mode`: Choose between 'best_match' or 'all_variations'
  - `suburb_limit`: Optional limit for number of suburbs displayed
  - `auto_supplement`: Control auto-adding suburbs when fewer than 11 specified
- Duplicate prevention in featured suburbs selection
- Better suburb name matching (e.g., "Burleigh" now matches "Burleigh Heads")
- Support for suburbs outside service radius

### Changed
- Featured suburbs now use `getSuburbsByName()` to fetch ALL specified suburbs
- Removed hard limit of 11 suburbs for manual selection
- Improved matching algorithm with priority: exact → starts with → contains
- Distance/direction now calculated for all featured suburbs

### Fixed
- Featured suburbs were limited to service radius only
- Always forced exactly 11 suburbs regardless of user specification
- Duplicate suburbs could appear in footer
- Poor matching logic missed partial matches

### Migration Guide
- Default `auto_supplement: true` maintains v1.0.28 behavior
- Set `auto_supplement: false` to show exact number of suburbs specified
- Use `suburb_selection_mode: 'all_variations'` for pre-v1.0.28 behavior

## [1.0.28] - 2025-09-14

### Added
- Smart suburb selection algorithm for footer featured suburbs
- New `selectBestSuburbMatch` function with priority-based selection
- New `processFeaturedSuburbs` function for single best match selection
- Debug logging to show selection reasoning
- TypeScript interface `SuburbMatch` for suburb scoring

### Changed
- **BREAKING**: Featured suburbs now show single best matches instead of all variations
  - Example: "Salisbury" now shows only "Salisbury" instead of "Salisbury", "Salisbury North", "Salisbury South", etc.
- Suburb selection prioritizes: 1) Population, 2) Base name match, 3) Distance, 4) Alphabetical
- Updated `getFooterLocations` to use new selection logic

### Fixed
- Issue where specifying a suburb name would include all variations
- Improved suburb matching patterns for better accuracy

### Migration Guide
- If you want to keep showing multiple variations, explicitly list each one in `featured_suburbs`
- See README.md for detailed migration instructions

## [1.0.5] - 2025-09-08

### Fixed
- Fixed duplicate location links in Footer component
- Main location now properly filtered from footer's dynamic location list
- Prevents the same location (e.g., "Adelaide") from appearing twice in footer

### Changed
- Improved footer location filtering logic to check against `siteConfig.mainLocation`
- Better handling of footer locations when main location is in the list

## [1.0.4] - 2025-09-07

### Added
- Enhanced location page generation
- Improved Spintax support for dynamic content

### Fixed
- Various bug fixes and performance improvements

## [1.0.3] - 2025-09-06

### Added
- Smart image matching system
- Stock photo integration support

### Changed
- Updated component registry
- Improved template processing

## [1.0.2] - 2025-09-05

### Added
- Footer locations utility
- Google Places integration

### Fixed
- Component import paths
- Build process optimization

## [1.0.1] - 2025-09-04

### Added
- Initial package release
- Core Astro components
- Layout templates
- Utility functions
- Location page builder
- Spintax processor
- Image handling utilities

### Features
- Pre-built components for local service websites
- Dynamic location page generation
- SEO optimization utilities
- Responsive design templates
- Configuration management