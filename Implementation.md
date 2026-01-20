UX Improvement: Service Selection Workflow
Current Problem
When a user clicks on a service (e.g., "Oil Change"), they see:

Service details with pricing breakdown by vehicle type
Two buttons: "Compare Shops" and "Request Quote"
Issue: Clicking "Request Quote" doesn't make sense yet because the user hasn't seen which shops offer this service!

Proposed Better Flow
Option A: Service Details → Compare Shops (Recommended)
Services Page → Click Service → Service Details Modal → "Find Shops" Button
                                                              ↓
                              Compare Shops View (pre-filtered to shops offering this service)
                                                              ↓
                              User selects shop(s) → Request Quote or Book Directly
Changes Needed:

In 
ServiceDetails
, change buttons to:
Primary: "Find Shops Offering This Service" → Goes to Compare view with service pre-selected
Secondary: "Back to Services"
Remove standalone "Request Quote" button from ServiceDetails
Quote requesting happens AFTER user sees and selects shops
Option B: Skip Service Details, Go Directly to Compare
Services Page → Click Service → Compare Shops (filtered by this service)
Even simpler, but loses the price breakdown table.

Recommended Implementation (Option A)
Step 1: Update 
ServiceDetails
 Component
Change "Request Quote" to "Find Shops"
Make "Find Shops" the primary action (larger, primary color)
Keep "Compare Shops" but rename to "Find Shops Offering This"
Step 2: Pass Service Context to Compare View
When navigating to Compare, pass selectedServiceId
Compare view filters to only show shops that offer this service
Step 3: Update Compare View
Show shops that offer the selected service
Each shop card shows their price for this service
User can select shops and request quotes
Step 4: Quote Flow
After comparing, user can:
Click "Request Quote from Selected Shops" (broadcast)
Or click a single shop → Book or Quote
Files to Modify
App.tsx
 - ServiceDetails component
CompareShopsView.tsx
 - Add filtering by service
Navigation logic to pass service context
