# Icon Style Unification - COMPLETED ✅

## Goal
Replace all gradient-based card header icon backgrounds with flat tinted pairs matching the Demographics `demoHeadIcon` pattern.

## Summary

### Files Modified
| File | Changes |
|---|---|
| **dashboard.jsx** | CSS: `.overviewCardIcon` border-radius 9→10, `.purple`/`.blue` → flat tints. 6 inline gradient icon styles → flat tint pairs. |
| **area.jsx** | 4 icon containers → flat tint pairs (Map, GIDA, Conflict, Access) |
| **livelihood.jsx** | 9 icon containers → flat tint pairs |
| **infrastructure.jsx** | 8 icon containers → flat tint pairs (Housing, Tenure, Water/Sanitation, Road, Electricity, Signal/Internet, Facility Reach, Classroom Density) |
| **safety.jsx** | 3 icon containers → flat tint pairs (Environmental Hazards, Household Pets, Safety & Food Security) |
| **activity.jsx** | `actHeaderIcon`/`outHeaderIcon` → added tinted 36×36 container styling |

### Color Pairs Used
- Blue: `bg: #e8f0fe` / `fg: #2f6fed` (or `#e6f1fb` / `#185fa5`)
- Purple: `bg: #f2e9fb` / `fg: #7c3aed`
- Green: `bg: #e4f8ef` / `fg: #17a673` (or `#0f9d58`)
- Red: `bg: #fdecea` / `fg: #e0392f` (or `#c0392b`)
- Amber/Yellow: `bg: #fef7e0` / `fg: #eab308` (or `#fdecd8` / `#c2650a`)
- Teal: `bg: #e6fbf5` / `fg: #0ea5e9`
- Slate: `bg: #e8eaf0` / `fg: #2a2d34`

### Not Converted (Intentional)
- **StatCard `grad` prop icons** — These are KPI card icons using a different component prop pattern (`grad="linear-gradient(...)"`), not card header icons. Would require component API change.
- **Chart fill gradients** (`.genderSplitFill`, `.foodSplitFill`, `.petVaxFill`, etc.) — These are data visualization fills, not icon containers.
- **Bar chart `BAR_COLORS`** — These are chart fill gradients for bar segments.
- **Tab bar `.dashTab.active`** — This is a button state background, not an icon container.

