# BGOC — Dashboard UI Guidelines
### Sidebar, Header, and Mobile Responsiveness Standard

This file applies to every dashboard in the app: the group-level admin dashboard and every store manager's dashboard. Feed this to Antigravity alongside `ai-avoidance-guidelines.md` whenever building or updating a dashboard screen.

**Build with shadcn/ui.** Use its components (Sheet for the mobile sidebar drawer, DropdownMenu for the header avatar menu, Table for data lists, Dialog for confirmations, etc.) rather than hand-rolling equivalents. Theme them to Document 1's palette and Inter/Roboto Mono typography — a shadcn component left in its default theme reads as generic, so the color/spacing tokens still need to be set deliberately, not left at defaults.

## The structure every dashboard follows

Every dashboard uses the same skeleton: a **fixed sidebar on the left** and a **fixed header across the top**, with the actual page content in the remaining space. This consistency matters more than any individual screen's content — once someone learns where things live in one dashboard, every other dashboard (their own store's, or the admin's) should feel instantly familiar.

## Header

- **Height:** compact and fixed — roughly 64px on desktop. It never scrolls away.
- **Left side:** the platform logo, icon only, no text (per Document 1), next to a **sidebar trigger button** — a small icon button (shadcn's standard "panel-left" toggle icon, not a hamburger), which toggles the sidebar between expanded and collapsed (icon-only) states. This must be functional — clicking it actually collapses/expands the sidebar, not a dead element.
- **Center or left-adjacent:** the current page's title (e.g. "Products," "Orders," "Store Settings") — this orients the person immediately, since the sidebar nav item alone isn't always enough context once they're several clicks in.
- **Right side, in this order:** a notification bell (with a small unread-count badge if there's anything pending — e.g. a new order, a store awaiting approval), then the user's avatar/initials with a dropdown (profile, account settings, log out).
- **What NOT to put in the header:** navigation links (that's the sidebar's job), marketing content, or anything that isn't about orienting the person or giving them quick access to their account and notifications.

## Sidebar

Use shadcn's Sidebar component (the standard collapsible sidebar pattern, e.g. its "sidebar-07" style block) rather than a custom-built hamburger drawer — it already handles the expanded/collapsed/mobile-overlay states correctly and consistently.

- **Width:** roughly 240–260px expanded; collapses to an icon-only rail (~64px, icons only, no labels) when toggled — via the header's sidebar trigger button, per above.
- **Top of sidebar:** the platform logo (icon only), same as the header's, reinforcing brand consistency.
- **Navigation items:** icon + label pairs, grouped logically with subtle section dividers or spacing (not just one long undifferentiated list). The active route gets a clear visual state — a filled background or a left accent bar in the brand red, not just a color change on the text alone, so it's readable at a glance. In collapsed (icon-only) mode, icons alone still clearly indicate the active route, and hovering shows a tooltip with the label.
- **Bottom of sidebar:** account-adjacent actions that don't belong in daily navigation — settings, help/support link, log out — kept visually separated from the main nav group above.

### Group-level admin sidebar routes
- Overview (high-level stats: pending approvals, today's orders, revenue snapshot)
- Store Approvals (the pending queue from Task 2)
- All Stores (every approved store, with quick access to suspend if needed)
- All Orders (across every store, filterable by store)
- Users (customer and store-manager accounts)
- Payouts / Revenue
- Settings

### Store manager sidebar routes
- Overview (this store's quick stats: today's orders, pending items)
- Products (add/edit/remove — the flow from Task 2)
- Orders (this store's orders only, RLS-enforced)
- Store Settings (logo, description, fulfillment type — editable after approval)
- Payouts

## Mobile responsiveness (non-negotiable)

Most users will open this on a phone first, not a desktop — this isn't optional polish, it's a core requirement.

- **Auto-collapse behavior:** the sidebar responds automatically to screen size, not just to a manual click. On a tablet-width viewport, it auto-collapses to the icon-only rail without the person needing to toggle it themselves — they still can expand it manually if they want. On phone-width viewports (typically below ~768px), it goes further: the sidebar hides entirely and becomes an overlay (shadcn's Sheet), triggered by the same sidebar trigger icon from the header. It slides in over the content (not push it), with a dimmed overlay behind it, and closes on tapping outside it or selecting a nav item.
- **The header stays fixed and simplified on mobile:** sidebar trigger + logo + notification bell + avatar, all comfortably tappable (minimum ~44px touch targets — this matters more than it sounds, cramped mobile nav is one of the fastest ways to make an app feel unprofessional).
- **Page content reflows, not shrinks:** tables become stacked cards on small screens rather than horizontally-scrolling tiny tables; forms go full-width; multi-column layouts collapse to a single column.
- **Test at common phone widths** (360px, 390px, 428px) before considering any dashboard screen finished — not just "does it not break," but "does it feel deliberately designed for this size."

## What makes this look professional, not templated

- Consistent spacing scale throughout (don't eyeball padding per screen — pick a scale, e.g. 4/8/12/16/24/32px, and stick to it everywhere).
- The active-state indicator in the sidebar and any data emphasis (prices, counts) should be the only places brand red shows up in the dashboard UI — restraint elsewhere keeps it feeling like serious software, not a marketing page.
- Numbers (prices, IDs, counts, timestamps) render in Roboto Mono; everything else in Inter — this small detail alone reads as considered and professional rather than default.
- No decorative animation in the dashboard context — motion here should only ever confirm an action (an item saved, an order status changed), never used as flourish.

## Once the real logo is supplied

Isaac is providing the actual platform logo separately. When it arrives, it replaces the placeholder in both the header and sidebar top — as an image asset only, not redesigned, not paired with text, and not resized inconsistently between the two locations (same visual weight in both).