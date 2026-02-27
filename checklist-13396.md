# Checklist for Ticket 13396: Sub menu component

**Ticket:** [13396](https://dev.azure.com/ericssondotcom-vnext/_workitems/edit/13396)  
**Title:** Sub menu component  
**Assignee:** Hiep Ta (EXT)  
**Priority:** HIGHPRIO  
**Sprint:** 156 (ends Jan 9, 2026)

## Current Sprint Scope
Focus on **block type and UI implementation only**. Horizon logic comes in a later phase.

---

## UI Implementation
- [ ] Review Figma design specs
- [ ] Create sub menu component structure
- [ ] Implement component styling (match MWC visual identity)
- [ ] Add responsive design for mobile/tablet/desktop
- [ ] Position menu in correct location on pages (as per design)

## Block Type Development
- [ ] Create new block type for sub menu
- [ ] Implement page selection field/interface
- [ ] Add configuration options for menu items
- [ ] Create separate field for menu positioning (to appear in specific place on all pages)
- [ ] Enable menu display on sub-pages not part of main hub navigation

## Menu Functionality (Basic)
- [ ] Implement static menu labels
- [ ] Add page linking functionality
- [ ] Handle active/selected state for current page
- [ ] Test navigation between pages

## Integration
- [ ] Integrate component into page editor
- [ ] Test component in content area
- [ ] Verify component works across different page types
- [ ] Test on pages within and outside main hub navigation

## Testing
- [ ] Unit tests for component
- [ ] Visual regression tests
- [ ] Cross-browser testing
- [ ] Accessibility testing (keyboard navigation, screen readers)
- [ ] Editor experience testing

## Documentation
- [ ] Document component usage for editors
- [ ] Add technical documentation for developers
- [ ] Document configuration options

---

## Future Phase (NOT in current sprint)
- [ ] Dynamic label implementation ("Create your horizon" → "My Horizon")
- [ ] Cookie consent integration
- [ ] Poll/questionnaire implementation
- [ ] Audience grouping logic
- [ ] Filtered page functionality
- [ ] State persistence for user selections

---

## Notes from Team Discussion
- Confirmed scope: Block type + UI only for Sprint 156
- Need separate field for menu positioning
- Menu should appear on sub-pages too, not just main hub pages
- Keep future "MyHorizon" functionality in mind during design

## Pull Requests
- PR #6921 (Jan 5, 2026)
- PR #6922 (Jan 5, 2026)
- PR #6937 (Jan 6, 2026)
- PR #6938 (Jan 6, 2026)
- PR #6956 (Jan 7, 2026)
