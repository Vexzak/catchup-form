# TODO — Fix TrendBadge / CornerTooltip overlap in Overview StatCards

## Problem
The `TrendBadge` (up/down percentage badge) and `CornerTooltip` "?" icon are both positioned in the top-right corner of the 3 StatCards (Total Sitios, Population, Households), causing visual overlap and making the tooltip hard to interact with.

## Plan
1. **Move `TrendBadge` out of `statCardTop`** — place it below the icon row, above the label.
2. **Add CSS for `.statCardTrend`** — small margin to separate it from the label below.

## Steps
- [x] Step 1: Create TODO.md
- [x] Step 2: Edit `StatCard` component — move `<TrendBadge>` below `statCardTop`
- [x] Step 3: Add `.statCardTrend` CSS rule

