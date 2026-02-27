# Checklist for Ticket #13650
## Main MWC hub hero component, 3 - cont

**Ticket:** [13650](https://ericsson-web.visualstudio.com/ericssondotcom-vnext/_workitems/edit/13650)  
**Type:** User Story  
**Status:** Testing in INTG  
**Priority:** HIGHPRIO  
**Assigned To:** Hiep Ta (EXT)  
**Created:** 2026-01-26  
**Last Updated:** 2026-01-28  

---

## Latest Comment Verification (Hiep Ta - 2026-01-27)

### Circular Gradient
- [ ] Size is 750px in diameter
- [ ] Middle point color is #EDB26E
- [ ] Middle point opacity is 50%
- [ ] Outer edge color is #EDB26E
- [ ] Outer edge opacity fades to 0%

### Ray Bar
- [ ] Middle point hex color is #FFEEDA
- [ ] Middle point opacity is 90%
- [ ] Edges color is #FFEEDA
- [ ] Edges opacity fades to 0%
- [ ] Ray width is adjusted to fit the Econ line

### Overlay - Not Hovered State
- [ ] Linear black gradient extends 60% of the width
- [ ] Gradient starts at 60% opacity on the left side
- [ ] Gradient fades to 0% on the right (middle of the page)

### Overlay - Hovered State
- [ ] Linear black gradient extends 60% of the width
- [ ] Gradient starts at 60% opacity on the left side
- [ ] Gradient fades to 0% on the right (middle of the page)
- [ ] Full width black background overlay is present
- [ ] Full width overlay opacity is 25%

---

## General Requirements

### Visual & Interaction
- [ ] Background highlights on mouse movement
- [ ] Background moves according to mouse movement
- [ ] Component feels "living" for visitors
- [ ] Visual identity matches on-site MWC event branding
- [ ] Design matches Figma prototype (Components – Figma)

### Technical Implementation
- [ ] Background video is working (initial implementation)
- [ ] Interactive movement effects are implemented (or planned for secondary phase)
- [ ] Implementation uses three.js or pixi.js (or similar technology)
- [ ] Component is responsive across different screen sizes

### Testing
- [ ] Test on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Test mouse movement interaction
- [ ] Test hover states
- [ ] Verify performance (no lag or jank during interactions)
- [ ] Verify gradient colors match specifications exactly

---

## Notes
- Background video can be used initially
- Moving effect can come as a secondary implementation
- Waiting for feedback on exact animation details

## Related Tickets
- Background: #13541
