# Checklist for Ticket #13390: Event hub page

**Ticket ID:** 13390  
**Title:** Event hub page  
**Type:** User Story  
**State:** Testing in INTG  
**Assigned to:** Hung Le (EXT)  
**Priority:** HIGHPRIO  
**Created:** 2025-12-11  
**Last Updated:** 2026-01-15

---

## Overview
Create an event hub page to list event speakers and sessions in an engaging way for MWC (Mobile World Congress) 2026.

---

## Requirements Checklist

### Page Structure
- [ ] Hero section with small hero block
- [ ] Extra small heading for event name
- [ ] Content areas for speaker/session pages
- [ ] Menu component field added
- [ ] Support for container block with 33/66 layout
- [ ] Allow other block types in content areas

### Functionality
- [ ] Speaker pages render as blocks when added to content area
- [ ] Session pages render as blocks when added to content area
- [ ] Similar to Section Start Page with enhancements
- [ ] Staggered content option per content area
- [ ] Support for new page types (Speaker, Session)
- [ ] Two new hero blocks supported

### Design Requirements
- [ ] Speakers listing page layout (first design)
- [ ] Sessions listing page layout (second design)
- [ ] Topic listing page can be built with this template
- [ ] Start page can be built with this template
- [ ] MWC visual identity maintained

### Technical Implementation
- [ ] Layout tab can be ignored (no left navigation)
- [ ] Content areas accept new page types
- [ ] Backend colors handle full-width blocks properly (no white lines)
- [ ] Grey backgrounds work correctly with full-width sections

---

## Testing Checklist

### Functional Testing
- [ ] Hero section displays correctly
- [ ] Event name heading displays properly
- [ ] Speaker pages render correctly in content areas
- [ ] Session pages render correctly in content areas
- [ ] Menu component works as expected
- [ ] Container block 33/66 layout displays properly
- [ ] Other block types can be added to content areas
- [ ] Staggered content option works per area

### Visual Testing
- [ ] Desktop view matches design
- [ ] Mobile view matches design
- [ ] Tablet view matches design
- [ ] Hero section responsive
- [ ] Content areas responsive
- [ ] Background colors display correctly
- [ ] No white lines between content areas

### Integration Testing
- [ ] Speaker page integration works
- [ ] Session page integration works
- [ ] Menu component integration works
- [ ] Topic page filtering works (if applicable)
- [ ] Full-width blocks work without white lines

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## Development Status

### Pull Requests
- 3 pull requests created
- PRs: #7007, #7005, #7004

### Commits
- 12 commits total
- Latest commits on 2026-01-15

### Branches
- Development branches created and merged

---

## Comments/Discussion Summary

### Key Decisions
1. **Page Template:** Use similar structure to Section Start Page with additions
2. **Flexibility:** Single flexible Event Hub Page that can create multiple layouts
3. **Hero Blocks:** Allow two new hero blocks
4. **Content Areas:** Each area needs staggered content checkbox
5. **Layout:** Container block used for 33/66 layouts

### Clarifications from Team
- Tai Phan confirmed understanding: One page type, multiple uses
- Can build Speakers listing, Sessions listing, Topic listing, and Start page
- Editors configure via blocks and content areas
- No separate page types needed for each layout

---

## Notes
- Part of MWC 2026 event hub initiative
- Mirrors on-site visual identity
- Centralized hub for curated event pages
- Social media promo alignment important

---

## Acceptance Criteria
- [ ] Event hub page can be created and configured
- [ ] Speaker pages display correctly when added
- [ ] Session pages display correctly when added
- [ ] Menu component can be added and works
- [ ] All layouts can be achieved through configuration
- [ ] No white lines between content sections
- [ ] Responsive across all devices
- [ ] Matches Figma designs
- [ ] Ready for INTG testing completion

---

**Status:** Currently in Testing in INTG  
**Next Steps:** Complete INTG testing and prepare for deployment
