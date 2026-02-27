# Ticket #13071 - rApps Filtering Implementation Checklist

**Status:** Testing in INTG  
**Assigned:** Vuong Nguyen (EXT)  
**Last Updated:** January 6, 2026

## API Integration

- [ ] Verify QA API connectivity and authentication
- [ ] Test classification property retrieval (`rAPP filters - MANUAL-RAPPS`)
- [ ] Implement API client for rApps data fetching
- [ ] Handle API response parsing for classification groups
- [ ] Test with sample products:
  - [ ] RAN_Insights_rApp
  - [ ] ERICSSON_SLICE_PARTITION_ADAPTATION_RAPP
  - [ ] Infovista_rApp
  - [ ] TECTWI_DIGITAL_TWINS_RAPP

## Data Model & Filtering

- [ ] Create rApp product detection logic (check for `rAPP filters - MANUAL-RAPPS`)
- [ ] Implement dynamic filter group extraction
- [ ] Store filter values from all imported products
- [ ] Add support for configurable filter order and labels
- [ ] Handle filter value updates on import (add/remove/rename)
- [ ] Implement filter synchronization with API data

## Page Implementation

- [ ] Create rApps listing page component
- [ ] Merge with existing A-Z Directory (RAPPS_AZDIRECTORY) page
- [ ] Preserve CMS-managed content (title, main image, text)
- [ ] Add site-settings configuration for page ID mapping
- [ ] Implement filtering UI with dynamic dropdowns
- [ ] Handle 6+ filter groups (expandable architecture)

## Product Display

- [ ] Implement alphabetical sorting (default)
- [ ] Ensure Ericsson rApps always appear on top
- [ ] Display product card with:
  - [ ] Image
  - [ ] Heading
  - [ ] Text description
  - [ ] Category (comma-separated, lighter text)
- [ ] Remove unnecessary elements per design

## Product Detail Page

- [ ] Add "rApp details" tab
- [ ] Display product features (similar to Marketplace)
- [ ] Ensure tab content matches design requirements

## Data Management

- [ ] Implement product import functionality
- [ ] Handle filter value updates post-import
- [ ] Test data synchronization with Hybris
- [ ] Validate classification group handling

## Testing

- [ ] Test with QA API data
- [ ] Verify filtering functionality
- [ ] Test sorting (Ericsson rApps priority)
- [ ] Validate responsive design
- [ ] Test filter group expansion
- [ ] Cross-browser testing
- [ ] Accessibility testing

## Integration Testing

- [ ] Test merge with A-Z Directory page
- [ ] Verify CMS content preservation
- [ ] Test site-settings configuration
- [ ] Validate import process end-to-end

## Production Preparation

- [ ] Switch to production API
- [ ] Verify production data structure
- [ ] Performance testing with full dataset
- [ ] Data cleanup verification (Hybris side)

## Documentation

- [ ] Document API integration
- [ ] Document filter configuration process
- [ ] Document site-settings setup
- [ ] Create user guide for content editors

## Code Quality

- [ ] Code review
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization

---

## Notes

- API was initially unstable but should be working in QA
- Production API enabled mid-December 2025
- Ticket currently has PRs but missing commits
- Similar logic to existing Marketplace functionality should be reused
