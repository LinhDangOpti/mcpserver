# Verification Checklist - Ticket #13723
## Expanding Text Block with Heading

**Ticket**: [#13723](https://ericsson-web.visualstudio.com/ericssondotcom-vnext/_workitems/edit/13723)  
**Status**: Testing in INTG  
**Assignee**: Hung Le (EXT)

---

## Functional Testing

### Block Creation & Configuration
- [ ] Block can be added to page in Optimizely CMS editor
- [ ] Heading field is available and accepts text input
- [ ] Content/text area accepts rich text/HTML content
- [ ] Height/character limit options are configurable
- [ ] Block saves successfully without errors

### Expand/Collapse Functionality
- [ ] Content is collapsed by default on page load
- [ ] Expand/collapse button/control is visible and clearly labeled
- [ ] Clicking expand shows full content
- [ ] Clicking collapse hides content again
- [ ] Animation/transition is smooth
- [ ] State persists during scroll (doesn't auto-collapse)

### Content Display
- [ ] Truncated content displays correctly in collapsed state
- [ ] Full content displays correctly when expanded
- [ ] Heading displays properly above content area
- [ ] Text formatting (bold, italic, links, etc.) is preserved
- [ ] No content is cut off or hidden inappropriately

---

## Visual & Layout Testing

### Design Integration
- [ ] Block aligns properly next to carousel block (150-year page use case)
- [ ] Height matches design specifications
- [ ] Spacing/padding is consistent with design system
- [ ] Fonts and typography match site standards
- [ ] Colors match design specifications

### Responsive Design
- [ ] Works correctly on desktop (1920px, 1366px, 1024px)
- [ ] Works correctly on tablet (768px, 834px)
- [ ] Works correctly on mobile (375px, 414px)
- [ ] Button/control is accessible on touch devices
- [ ] Content reflows properly at all breakpoints

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Expand/collapse control is keyboard accessible (Tab)
- [ ] Can be activated with Enter/Space key
- [ ] Focus indicator is visible
- [ ] Tab order is logical

### Screen Reader Support
- [ ] Heading is announced correctly
- [ ] Expand/collapse state is announced
- [ ] Content is accessible when expanded
- [ ] ARIA attributes are implemented correctly (aria-expanded, aria-controls)

### General Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Text is resizable up to 200% without breaking
- [ ] Focus is managed properly when expanding/collapsing

---

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Performance Testing

- [ ] No console errors in browser
- [ ] No JavaScript errors
- [ ] Page load time not significantly impacted
- [ ] Smooth animation performance (60fps)
- [ ] Works with multiple blocks on same page

---

## CMS Editor Experience

- [ ] Block appears in block selector/menu
- [ ] Block preview works in edit mode
- [ ] Changes save correctly
- [ ] Block can be moved/reordered on page
- [ ] Block can be deleted
- [ ] Block can be duplicated

---

## Edge Cases

- [ ] Very long content (5000+ characters)
- [ ] Very short content (1-2 lines)
- [ ] Empty content field
- [ ] Content with special characters
- [ ] Content with embedded images/media
- [ ] Multiple blocks on same page
- [ ] Block inside other container blocks

---

## Integration Testing (150-Year Page)

- [ ] Works correctly alongside small carousel block
- [ ] Visual height matches carousel height
- [ ] Layout doesn't break on different screen sizes
- [ ] Both blocks load correctly together

---

## Notes & Issues

**Date**: _____________  
**Tester**: _____________

### Issues Found:


### Additional Comments:

