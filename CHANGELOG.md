# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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