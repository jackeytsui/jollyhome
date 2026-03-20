# Deep Competitive Teardown: Shared Calendar + Meal Planning
**Domain:** Household scheduling and food coordination apps
**Researched:** 2026-03-19
**Overall Confidence:** HIGH (multiple independent sources, official docs, current reviews)

---

## Part 1: Competitor Teardowns

---

### 1. Cozi — The Family Calendar Standard

**What it is:** The most-used dedicated family calendar app. Free with ads; $29.99–$39/year for Gold (ad-free premium).

#### Core UX Flow
- Each household member gets a name and color (up to 12 members)
- Events display with the member's color dot; multi-person events show multiple dots
- Filter view by person: tap a name to see only their schedule
- Shared shopping lists with real-time sync — anyone can add items
- Email agenda: sends a daily/weekly email digest to all family members (a killer feature for non-app users)
- Meal planning: a very basic recipe box + weekly dinner planner (not AI-driven)

#### What Power Users Love
- Color-per-person is intuitive and genuinely useful at a glance
- Email agenda means grandparents and reluctant adults participate without opening the app
- Shopping list with live "someone just added X" awareness
- Single family account (no per-user login hell) — one password, everyone in

#### What Casual Users Love
- Extremely low friction to get started
- "It just works" for the core use case: who's doing what, when
- Cross-platform (iOS, Android, web) with reliable sync

#### Critical Frustrations (2024–2026)
- **30-day wall (since May 2024):** Free tier can only view events within 30 days. Can't plan summer camp or Christmas without upgrading. Long-time users called it a "bait and switch." Trustpilot dropped to 2.1 stars.
- **No permission levels:** Any family member can delete any event. No admin role, no locked events — confirmed by Cozi support as intentional.
- **No two-way sync:** One-way push to Google Calendar only. Changes in Google do not come back to Cozi.
- **No data export:** No CSV, no .ics export. Leaving Cozi means losing all history.
- **Dated design:** UI has not meaningfully refreshed since ~2015. Functional but visually stale.
- **No AI:** Zero AI features in Cozi Gold. Competitors can now extract events from photos. Cozi cannot.
- **Privacy warning:** Common Sense Privacy rates Cozi with a "Warning" — data used for ad targeting, shared with third parties (free tier).
- **Alexa integration is shallow:** Works with lists only, not calendar — misleading marketing.

#### Integration Points
- One-way push to Google Calendar
- Apple Calendar (read)
- Email reminders (strong)
- No shopping/grocery delivery integration
- No recipe or meal planning pipeline beyond a basic recipe box

#### Pricing Model
- Free: Ad-supported, 30-day calendar limit, basic lists
- Gold: $29.99/yr (sale) or $39/yr — ad-free, month view on mobile, multiple reminders, birthday tracker, shopping mode

#### What HomeOS Should Learn
- Email digest is underrated. Non-app users still participate. HomeOS must have this.
- Single household account (not per-user accounts) lowers adoption friction dramatically.
- Color-per-person is the minimum viable calendar UX. Non-negotiable.
- The 30-day paywall destroyed user trust overnight. Never gate core calendar functionality.

---

### 2. TimeTree — The Social Shared Calendar

**What it is:** A shared calendar built around communication and multiple concurrent shared calendars. Free with ads; Premium at $4.49/month or $44.99/year.

#### Core UX Flow
- Create named, independent shared calendars (one per relationship context: Family, Couple, Team)
- Each calendar has its own embedded group chat — no need to open a separate messaging app
- Events have comment threads ("event memos") for in-context discussion
- Photo sharing tied to dates — transforms calendar into a memory book
- Syncs with Google Calendar, Apple Calendar, Outlook
- Unlimited shared calendars (major differentiator vs. Cozi's single-household model)

#### What Power Users Love
- Multiple calendars: keep work, family, and personal visible simultaneously
- Per-event chat is genuinely useful for "are you coming to this?" coordination
- Photo attachments to dates create a living household timeline
- Modern, clean interface — feels actively maintained

#### What Casual Users Love
- Free tier is genuinely capable (not artificially crippled)
- Very fast to add another person to a shared calendar
- Works across every platform

#### Critical Frustrations
- No native chores, shopping lists, or meal planning — pure calendar
- Chat is inside the app, not SMS/email — non-users don't see updates
- No granular permissions within a calendar
- Premium features feel thin for the price
- Weaker Google Workspace integration than pure Google Calendar

#### Integration Points
- Google Calendar (two-way sync)
- Apple Calendar (two-way sync)
- Outlook sync
- No shopping, chores, or household module integration

#### Pricing Model
- Free: Ads, unlimited shared calendars, chat, photo sharing
- Premium: ~$45/year — ad-free, calendar themes, priority support

#### What HomeOS Should Learn
- Per-event commenting is a natural fit for household coordination. HomeOS events should support threaded discussion.
- Multiple calendar contexts (family, roommates, personal work) matter. HomeOS should support "layers" that can be shown/hidden.
- Photo attachments to events (party photos, maintenance before/after shots) build household memory.

---

### 3. Google Calendar (Shared) — The Powerful but Clunky Option

**What it is:** Not built for families, but millions of families use it because it's free, reliable, and already installed.

#### How Families Use It
- Create a "Family" calendar and share it with household members' Google accounts
- Each person keeps their own Google Calendar plus can see the shared one
- Color-code the family calendar to distinguish it from personal calendars
- Use Google Family Group for auto-sharing

#### What Works
- Ubiquity: everyone already has it
- Best-in-class event creation (NLP: "dentist Tuesday at 3" works)
- Excellent integration with Gmail (auto-creates events from confirmation emails)
- Works on every device, never loses data
- Two-way sync with virtually everything

#### What Is Frustrating
- **No real-time change notifications:** By default, you do NOT get notified when a family member creates, edits, or deletes an event. The family calendar is essentially invisible unless you're actively checking it.
- **Multi-platform chaos:** If family members use Apple, Google, and Outlook, calendar sharing breaks. Events go stale.
- **No family-specific features:** No color-per-person (you get color-per-calendar), no household lists, no meal planning, no chores.
- **Family Group friction:** Requires everyone to have a Google account, be in the same Family Group, and accept the shared calendar — each step loses people.
- **"Busy" status bug:** Google Family Calendar events are not recognized as "busy" by third-party scheduling tools (documented Calendly complaint).
- **Can't delete Family Group cleanly:** Deleting the group doesn't delete the calendar; manual cleanup required.
- **No household context:** It's a scheduling tool, not a household tool. Meals, chores, and maintenance don't fit naturally.

#### Integration Points
- Everything. Google Calendar is the integration hub of the calendar world.
- No household-specific integrations (shopping, chores, meals) built-in.

#### What HomeOS Should Learn
- HomeOS MUST integrate with Google Calendar and Apple Calendar as read/write sync. Families will not abandon Google Calendar entirely.
- NLP event entry ("dentist Tuesday at 3pm") is table stakes.
- Change notification gaps are real pain. HomeOS should push "John added an event" notifications to all members.

---

### 4. FamCal — The Budget-Friendly All-In-One

**What it is:** A family-focused app that bundles calendar, task assignment, shopping lists, memos, recipes, and trip expense tracking. Free, shared password model.

#### Core UX Flow
- Shared single-account model (one login, shared password — same as Cozi)
- No requirement for individual email per member — great for young kids
- Desktop supports bulk event creation, attachment uploads (permission slips, medical forms, flyers)
- Real-time sync: add event → all devices update immediately
- Shopping lists per store (different lists for Costco vs. local grocery)
- Recipe sharing within the family account
- Basic trip expense tracking

#### What Works
- Per-store shopping lists are genuinely useful (Cozi has one combined list)
- Attachment uploads to events solve a real problem (field trip permission forms, school schedules)
- No per-user account requirement lowers the barrier for kids and elderly members
- Completely free

#### What Is Missing
- No AI features
- Basic design, not modern
- No meal planning pipeline (recipe box exists but isn't connected to shopping)
- No two-way sync with Google/Apple Calendar
- Shared password model is a security antipattern for shared living among adults (housemates vs. family)

#### What HomeOS Should Learn
- Per-store shopping lists solve a real organizational need. HomeOS should support multiple lists (Costco run vs. weekly groceries).
- Attachments on events (contracts, maintenance invoices, receipts) are a killer feature for household management.
- The shared-account model works for families but not for adult housemates who want privacy. HomeOS needs role-based access: shared household view + personal private calendars.

---

### 5. Mealime — The Dietary Filter Champion

**What it is:** Meal planning app focused on personalization and 30-minute recipes. Free; Pro at $2.99/month.

#### Core UX Flow
1. Onboard with 200+ dietary preferences, allergies, disliked ingredients
2. Weekly meal plan generated from your profile (not true AI — curated recipe matching)
3. Select meals → one-tap shopping list sorted by store aisle
4. Shopping list connects to grocery delivery partners (Instacart, etc.) at no markup
5. Cook: step-by-step recipe view, single-serving or scale to household

#### What Power Users Love
- Breadth of dietary filters: paleo, vegan, vegetarian + 10 allergens + 100+ ingredient exclusions
- Aisle-sorted shopping list eliminates backtracking in-store
- 30-minute recipe constraint keeps it practical for busy weeknights
- Grocery delivery integration: go from plan to cart in under 10 minutes

#### What Is Missing
- Planning is for one person/one dietary profile. Households with mixed diets (vegan + omnivore) require separate accounts.
- No household attendance awareness — doesn't know if it's a 2-person dinner or 6-person dinner
- No pantry tracking — assumes you have nothing; no waste reduction
- Recipe database is curated/closed — you can't import your own recipes
- No calendar integration
- No meal history learning — preferences update only through manual survey changes

#### Pricing Model
- Free: Core planning + standard recipes + shopping list
- Pro ($2.99/mo): Exclusive recipes, nutrition data, calorie customization, previous meal plans

#### What HomeOS Should Learn
- 200+ filter onboarding is thorough but overwhelming. HomeOS should use progressive onboarding: ask 5 key questions first, refine over time.
- Aisle-sorted shopping lists are a must. This is table stakes.
- Grocery delivery integration (Instacart) is a distribution moat. Build it.
- The closed recipe database is Mealime's biggest weakness. HomeOS wins by being open: import from URL, paste, photo, or use any recipe source.

---

### 6. Paprika — The Recipe Management King

**What it is:** A per-device one-time purchase app (iOS, Android, macOS, Windows) for recipe collection, meal planning, pantry tracking, and grocery lists. No subscription for core functionality.

#### Core UX Flow
1. Built-in browser: navigate to any recipe URL, tap "Save" — app parses ingredients, steps, photos automatically
2. Recipe collection organized by tags, categories, ratings, cook count
3. Drag recipes onto a calendar (daily/weekly/monthly view)
4. Pantry: track what you have, set expiry dates
5. Grocery list: manually add items or add from a recipe; sorts by aisle
6. Cloud sync across all your devices

#### What Power Users Love
- Web clipper is best-in-class for accuracy and reliability — handles edge cases other apps miss
- One-time payment model: pay once, own forever, no monthly anxiety
- Pantry integration: 2025 update added intelligent suggestions based on pantry stock
- Fully offline-capable — works without internet
- Recipe scaling built-in
- Cook count and rating on every recipe builds a personal "greatest hits" collection

#### Critical Frustrations
- **Meal plan ↔ shopping list is BROKEN:** Adding a recipe to the meal planning calendar does NOT automatically add ingredients to the grocery list. These are two separate manual steps. This is the most-cited complaint.
- Per-platform pricing: iPhone + iPad + Mac = 3 separate purchases. Expensive for multi-device households.
- Meal planning calendar is just a calendar — no AI, no suggestions, no waste optimization
- No real household sharing. The "sync" is per-account, not multi-user.
- No integration with external calendars (Google, Apple Calendar)
- Design feels dated relative to newer apps

#### Pricing Model
- iOS: $4.99 one-time
- macOS: $29.99 one-time
- Android: $4.99 one-time
- Windows: $19.99 one-time
- Cloud sync: Included (not a separate subscription)

#### What HomeOS Should Learn
- The web clipper is table stakes for serious recipe management. HomeOS must have URL-to-recipe import.
- The broken meal-plan-to-shopping-list pipeline is the most painful gap in the market. Any app that makes this seamless wins Paprika's user base.
- Cook count and "have I made this before?" history is underrated. HomeOS should track which meals a household has cooked.
- Offline functionality matters for grocery store use.

---

### 7. Plan to Eat — The Drag-and-Drop Meal Planner

**What it is:** Web-first, calendar-centric meal planning app. The best drag-and-drop planning UX in the market. $5.95/month or $49/year, with 14-day free trial.

#### Core UX Flow
1. Import recipes from any URL via recipe clipper
2. Open the planner — a full calendar view showing Breakfast/Lunch/Dinner slots per day
3. Drag recipes from the side panel onto any day/meal slot
4. Planner auto-generates shopping list from all planned recipes, organized by aisle
5. Mark items as "in pantry" to subtract from shopping list
6. Share plan and shopping list with family members in real time

#### What Power Users Love
- The drag-and-drop interface is genuinely best-in-class — fluid, fast, visual
- Auto-shopping list from plan to list is the core flow and it works perfectly
- Leftovers support: drag a meal to a future day to indicate planned leftovers
- Nutritional data display across the weekly plan
- Recipe ingredient editing with drag-drop reordering and header rows
- Family sharing is built in

#### What Is Missing
- No AI suggestions — fully manual
- No household schedule integration (no awareness of who's home which night)
- No pantry scanning or ingredient tracking
- No grocery delivery integration
- Mobile app is weaker than web — this is primarily a desktop experience
- No meal history for learning or recommendations

#### Pricing Model
- $5.95/month or $49/year
- 14-day free trial, no credit card required

#### What HomeOS Should Learn
- The drag-and-drop planner is the right UX metaphor for manual meal planning. HomeOS should offer it.
- "Plan auto-generates shopping list" is the killer feature — this seamless pipeline is the entire value proposition. Copy it.
- Leftovers as a first-class concept (plan a meal, then plan the leftovers) reduces waste and decision fatigue.

---

### 8. Yummly — The Personalization Pioneer (Discontinued December 2024)

**What it was:** A recipe discovery and recommendation app powered by AI personalization, owned by Whirlpool. Shut down December 2024.

#### What It Did Well (Before Shutdown)
- AI-powered Home Feed: personalized recipe recommendations using learned taste profiles
- Filters across nearly 2 million recipes: diets, allergies, tastes, cuisines
- Connected to Whirlpool smart appliances (auto-set oven temperature from recipe)
- Meal kit delivery partnerships
- "Yum" system — recipe saving trained the recommendation algorithm

#### Why It Failed
- Whirlpool prioritized appliance integration over recipe utility
- The app became a marketing vehicle for Whirlpool products
- Heavy competition from Samsung Food (formerly Whisk) and Mealime
- No household sharing or collaborative planning — individual-focused
- Acquisition killed product velocity; no meaningful updates for 2+ years before shutdown

#### What HomeOS Should Learn
- Smart appliance integration (connect recipe to oven settings) is a future differentiator — but don't let hardware partnerships compromise software utility.
- 2 million recipe database is only valuable if recommendations are good. Volume without quality loses to a smaller, well-curated set.
- Recipe saving should train personalization. Every household action (cooked this, skipped that) should feed the recommendation engine.

---

### 9. Samsung Food (formerly Whisk) + MealFlow — The AI Newcomers

#### Samsung Food (formerly Whisk)

**What it is:** Originally Whisk, acquired by Samsung, rebranded as Samsung Food. AI-powered recipe and meal planning app. Free; Food+ at $6.99/month or $59.99/year.

**Core AI Features:**
- Import from 2+ million websites (URL clipping)
- Vision AI: photograph your fridge/pantry, app identifies ingredients and suggests recipes
- AI-personalized weekly meal plans (Food+ tier)
- AI recipe modification: make this dish vegan, cut the spice, double the protein
- Smart grocery list: consolidates ingredients across multiple recipes, removes duplicates
- Grocery delivery integration: one-click add to Instacart or similar
- Family collections: collaborative recipe books per household member

**Key Differentiators:**
- Vision AI for ingredient recognition is genuinely novel — snap pantry, get recipes
- Recipe modification (make it vegan) is the best in class
- Samsung ecosystem integration (SmartThings, Samsung appliances)

**Frustrations:**
- Feels more like Samsung marketing than an independent app
- Premium tier is expensive ($60/year) for features competitors offer cheaper
- Samsung ecosystem lock-in reduces appeal for non-Samsung households

#### MealFlow AI

**What it is:** Pure AI meal planning SaaS. Free tier (10 generations/month); paid from ~$3/week (~$12/month).

**Core AI Features:**
- Natural language instructions: "Plan two easy Italian dinners this week"
- Handles mixed household dietary needs in one plan
- Allergen filtering as a core safety layer (not an optional filter)
- One-click Instacart shopping list generation
- Nutritional summary per meal plan (calories, macros, micros)
- "Swap" feature: instant alternative for any meal that fits dietary rules

**What's Missing:**
- No recipe import from URLs (AI generates from scratch)
- No pantry awareness / waste reduction
- No integration with any household calendar
- No household attendance awareness (doesn't know if 2 or 5 people are eating)

**What HomeOS Should Learn From Both:**
- Vision AI for pantry recognition is a real differentiator for waste reduction. HomeOS should support pantry photo scan.
- Natural language meal planning ("easy meals this week, we have chicken to use up") is the right UX — not dropdowns and filters.
- Recipe modification AI (make this gluten-free, cut it in half) reduces the need for separate recipes per dietary restriction.

---

## Part 2: Best-in-Class Synthesis

### What the Best Calendar Apps Get Right

| Feature | Who Does It Best | Why It Matters |
|---------|-----------------|----------------|
| Color-per-person | Cozi | At-a-glance clarity for shared schedules |
| Per-event chat | TimeTree | Keeps coordination in context, not in group chat |
| Email digest | Cozi | Includes non-app users (kids, elderly, reluctant partners) |
| Two-way sync | Google Calendar | Everyone already lives in Google/Apple Calendar |
| Multiple calendar contexts | TimeTree | Work, family, personal co-exist without collision |
| Attachment uploads | FamCal | Documents (invoices, permission slips) belong on events |
| NLP event entry | Google Calendar | "Dentist Tuesday 3pm" is faster than any form |

### What the Best Meal Planning Apps Get Right

| Feature | Who Does It Best | Why It Matters |
|---------|-----------------|----------------|
| Drag-and-drop weekly planner | Plan to Eat | Visual, tactile, fast — feels like arranging sticky notes |
| Plan → shopping list pipeline | Plan to Eat | The core flow must be automatic, not manual |
| Web URL recipe import | Paprika, Honeydew | Users have recipes everywhere — meet them there |
| Dietary filter breadth | Mealime | Mixed-diet households are the norm, not the exception |
| Ingredient waste optimization | Ollie, SuperCook | Overlapping ingredients across the week reduces cost + waste |
| AI recipe modification | Samsung Food | Make this vegan/gluten-free without a separate recipe |
| Pantry vision scan | Samsung Food | Snap fridge, get suggestions — removes manual pantry entry |
| Aisle-sorted shopping list | Mealime, Plan to Eat | Saves time in-store, reduces backtracking |
| Grocery delivery integration | MealFlow, Whisk | Plan → cart in one tap is the endgame |

### The Broken Pipeline Everyone Has

Every app in this landscape breaks at one or more of these seams:

1. **Calendar ↔ Meal plan:** No calendar app knows which dinners are planned. No meal planning app knows who's home which night.
2. **Meal plan ↔ Pantry:** Most apps don't know what you already have. They generate redundant shopping.
3. **Shopping list ↔ Pantry:** After shopping, the pantry doesn't update. After cooking, pantry doesn't decrement.
4. **Household attendance ↔ Meal sizing:** Nobody knows Tuesday has 3 people, Saturday has 6. Recipes don't auto-scale.
5. **Recipe history ↔ Suggestions:** Past meals don't inform future suggestions. Apps have no memory.

HomeOS wins by closing every one of these seams.

---

## Part 3: Innovation Opportunities

### Calendar Innovation Opportunities

**1. The Unified Household Layer**
No existing app puts chores, meals, maintenance, quiet hours, and guest visits on the same calendar. These are all time-bound household events. A unified "household layer" where every type of event (not just appointments) lives on one timeline is a genuine gap.

**2. Calendar-Aware Dinner Sizing**
The calendar knows who's home Tuesday night. The meal planner should query the calendar and say: "3 people home Tuesday (John has soccer, Sarah out late). Plan a quick 2-person dinner + 1 portion for Sarah when she returns?" No app does this.

**3. Household Attendance as a First-Class Concept**
"Home tonight?" as a native event type — different from blocking calendar time. A lightweight RSVP for dinner that feeds meal planning and gives the household a daily headcount. Currently requires a group chat poll or assumption.

**4. Maintenance and Guest Events on the Same Calendar**
When plumber is scheduled 9–11am Tuesday, that's a household event that affects everyone. When guests stay for a weekend, that affects meals, chores, and quiet hours. These belong on the household calendar alongside birthdays and soccer practice.

**5. Quiet Hours as Calendar Blocks**
Many households have recurring quiet hours (work-from-home days, baby's nap, early risers). These should display as soft blocks on the shared calendar — visible to everyone, optionally respected by notification logic.

**6. Shared Space Bookings Within the Home**
For housemates especially: "I have the living room 7–10pm Friday for a movie night." A lightweight room-booking feature within the household calendar. Currently people coordinate this via group chat.

### Meal Planning Innovation Opportunities

**1. Cross-Week Ingredient Overlap Optimization**
An AI that deliberately selects meals where multiple dinners share expensive ingredients (a bunch of cilantro used Monday AND Wednesday; chicken thighs used two ways) reduces waste and cost. Ollie does this weakly. Nobody does it well.

**2. Calendar-Informed Meal Suggestions**
Monday: soccer practice ends at 7pm — suggest a 20-minute dinner.
Wednesday: both adults work late — suggest a slow cooker or leftover meal.
Friday: guests confirmed for dinner — suggest a make-ahead recipe for 6.
This requires the meal planner to read the household calendar. No app does this.

**3. Pantry Drain Awareness**
Track what's in the pantry (manually, via photo scan, or by marking shopping list items as purchased). When something is nearing expiry or when "use it up" ingredients exist, surface those in meal suggestions. This is the "fridge clean-out meal" feature that households actually want.

**4. Household Dietary Profile Matrix**
Instead of one dietary profile, maintain a matrix: household member × dietary restriction. AI plans meals that satisfy the intersection OR suggests modular meals (base + toppings) where one recipe accommodates everyone. A family with one vegan, one gluten-free, and two omnivores shouldn't need four separate apps.

**5. Recipe History as Training Data**
Every meal a household cooks teaches the AI: frequency (made 3 times = loved), rating (1–5), time taken vs. estimated, modifications made. Over time, the AI's suggestions get tighter and more accurate. No app currently does this well for households (vs. individuals).

**6. The "Cook Tonight" Mode**
A simplified view that answers one question: "What can I make tonight with what I have?" — filtered by time available, who's eating, and what's in the pantry. Not a full week plan. A quick answer for 6pm.

### Calendar + Meals + Shopping Pipeline Innovation

**The Full Pipeline HomeOS Should Own:**

```
Household Calendar
       ↓
  "Who's home Tuesday?"  →  Attendance confirmed: 4 people
       ↓
  AI Meal Suggestion    →  "Pasta night — 25 min, uses up basil from Monday"
       ↓
  Meal Plan Calendar    →  Recipe pinned to Tuesday dinner slot
       ↓
  Pantry Check          →  "Have: pasta, olive oil. Need: cherry tomatoes, parmesan"
       ↓
  Shopping List         →  Items added, aisle-sorted, de-duplicated with rest of week
       ↓
  Grocery Delivery      →  One-tap Instacart or share list for in-store trip
       ↓
  Cook + Mark Done      →  Pantry decrements, meal logged in household history
       ↓
  AI Learning           →  "Tuesday pasta meals: always popular. Save for rotation."
```

This pipeline does not exist in any single app today. Building it — with the calendar informing meal sizing, pantry tracking reducing waste, and household history training AI — is HomeOS's meal + calendar moat.

---

## Part 4: Recommended HomeOS Calendar + Meal Spec

### Calendar System Specification

#### Architecture

- **Unified household timeline:** One calendar where ALL household events co-exist — appointments, chores, meals, maintenance, guests, quiet hours
- **Event types with distinct visual treatment:**
  - Personal events (private, shown as "Busy" to others)
  - Household events (visible to all, color-coded by creator/assignee)
  - Meal plans (linked to recipe, shows meal name + cook)
  - Chore events (linked to chore system, shows assignee + completion status)
  - Maintenance windows (linked to maintenance tracker, shows category icon)
  - Guest visits (triggers guest management module)
  - Quiet hours (recurring soft block, affects notification behavior)
  - Shared space bookings (room reservation within the home)
- **Layers / filters:** Toggle visibility of event types. Show just appointments. Show everything. Show just meals + chores. Households with roommates vs. families will use different defaults.

#### Color System
- Each household member has a color (Cozi-style)
- Events with multiple assignees show blended or multi-dot indicator
- Event type gets an icon (meal = fork, chore = checkmark, maintenance = wrench, guest = person silhouette)

#### Per-Event Features
- Title, time, location (within home or external)
- Assignees (with color dots)
- Notes / description
- Threaded comments (TimeTree-style) — household members can discuss
- Attachments (FamCal-style) — documents, photos, invoices
- Linked records: tap a meal event to open the recipe; tap a chore event to complete it
- Recurrence with smart patterns (every 2 weeks, first Monday of month, etc.)

#### Change Notification System
- Push notification when any member adds/edits/deletes an event (the gap Google Calendar has)
- Digest option: daily morning summary of "today's household schedule" (Cozi's email digest, but as push/email)
- "Who's home tonight?" evening prompt → members RSVP → feeds dinner sizing

#### External Calendar Sync
- Two-way sync with Google Calendar and Apple Calendar
- HomeOS household events appear in Google Calendar; personal Google Calendar events appear in HomeOS (as "Busy" blocks, respecting privacy)
- Do NOT let external events mutate HomeOS events (read-only from external)

#### Views
- Day view: chronological, all event types, color-coded
- Week view: default household view, shows meal plan for each day in dinner slot
- Month view: high-level, event dots by color (who has what when)
- Agenda view: list format, great for the "what's today" quick check
- Meal-only view: shows just the dinner plan for the week — the weekly menu board

### Meal Planning System Specification

#### Architecture
The meal planning system has five layers:

**Layer 1: Recipe Library**
- URL import (one-tap clip from any recipe website)
- Manual entry
- Photo import (snap a recipe card — AI extracts ingredients and steps)
- Social media import (Instagram, TikTok recipe posts)
- Household recipe sharing — member-created recipes visible to all
- Fields: title, description, ingredients, steps, cuisine, cook time, servings, dietary tags, photos, source URL
- Tags: dietary restrictions, cuisine, time, difficulty, household rating, cook count
- Meal history: every time household cooks a recipe, log it

**Layer 2: Household Dietary Matrix**
- Per-member dietary profile: restrictions (gluten-free, vegan, nut allergy), dislikes (cilantro, mushrooms), preferences (spicy OK, Mediterranean cuisine loved)
- AI uses the intersection when generating suggestions
- Modular meal flag: mark a recipe as "modular" — AI can suggest it even if one member has a restriction (e.g., pasta with sauce on side for the dairy-free member)

**Layer 3: Pantry Tracker**
- Manual entry with expiry dates
- Photo scan (Vision AI identifies what's in fridge/pantry)
- Auto-populate from marked shopping list items (check off at store = pantry gains item)
- Auto-decrement when a meal using that ingredient is marked as cooked
- Low-stock and expiry alerts
- "Use these up" button → AI suggests meals that use expiring items

**Layer 4: AI Meal Planner**
- Weekly view with Breakfast / Lunch / Dinner / Snack slots per day
- AI generation mode: natural language input ("suggest dinners for a busy week, we have chicken to use up")
  - AI reads: household dietary matrix, pantry contents, calendar (who's home, how much time), recent meal history
  - AI optimizes: ingredient overlap across the week (reduce waste), variety (no repeat proteins), time constraints per day
  - AI output: full week of meals with shopping list delta (what to buy beyond pantry)
- Manual mode: drag-and-drop from recipe library (Plan to Eat style)
- Hybrid: AI generates a draft, household edits by swapping individual meals
- Leftovers support: mark a dinner as "planned leftovers for lunch Thursday"
- "Cook tonight" quick mode: single question, one answer

**Layer 5: Shopping Integration**
- Meal plan → shopping list is automatic (Plan to Eat's killer feature)
- Pantry check: before adding to list, subtract what's already in pantry
- De-duplicate across the week (2 recipes with olive oil = 1 shopping list entry)
- Aisle organization (configurable per store)
- Multiple lists: one for Costco bulk run, one for weekly groceries
- Family sharing: any member sees and edits the list in real time; "someone just added X" notification
- Grocery delivery: one-tap Instacart / Kroger / Whole Foods add to cart
- Check-off mode: shopping-optimized UI (full-screen, no-dim, checked items move to bottom, highlighted items added by others while shopping)

#### Meal ↔ Calendar Integration (The Core Innovation)

1. Every planned meal appears on the household calendar as an event in the dinner slot
2. Calendar events show meal name, prep time estimate, and assigned cook
3. Tapping a calendar meal event opens the recipe
4. The "who's home tonight?" attendance feature feeds dinner portion sizing
5. AI reads calendar load when suggesting meals: long day = quick meal; guests Saturday = make-ahead recipe
6. Household can "RSVP no to dinner" — marks them as absent, AI adjusts portions

#### Learning Loop
- Rate each meal (thumbs up/down, or 1–5 stars)
- Mark modifications made ("added more garlic", "used turkey instead of beef")
- Track cook time actual vs. estimated (improves future time estimates)
- Household meal history: searchable log of every meal cooked, when, by whom, rated how
- AI uses this history to improve suggestions: "Your household loves Thai food on Fridays. Suggesting Pad Thai."

### UX Flow Summary: From Week Planning to Grocery Done

**Monday morning, 2 minutes:**
1. Open HomeOS → Meal Planner
2. Tap "Plan my week" → AI sees: 4 busy weeknights, guests Saturday, pantry has leftover chicken + wilting spinach
3. AI draft appears: spinach chicken pasta Monday (uses pantry), slow cooker Tuesday (both adults work late), pizza kit Wednesday (kids home from school), takeout Thursday (booked per calendar), dinner party menu Saturday
4. Household member adjusts: swaps Thursday takeout for a recipe they saved
5. Tap "Generate shopping list" → list auto-generated, pantry items already subtracted, sorted by aisle
6. Tap "Send to Instacart" → order placed
7. Done.

**Tuesday evening, 10 seconds:**
- Push: "HomeOS: What's for dinner tonight? Slow cooker chicken is planned. John is cooking. Need 30 min."
- Tap "Mark as cooked" → pantry decrements, meal logged, AI notes the household cooked this

---

## Confidence Assessment

| Area | Confidence | Sources |
|------|------------|---------|
| Cozi teardown | HIGH | Multiple review sites, official Cozi docs, 2025 pricing pages, Trustpilot data |
| TimeTree teardown | HIGH | Toolstack, Toolfinder, OurCal, official TimeTree site |
| Google Calendar | HIGH | Official Google support docs, multiple comparison reviews |
| FamCal teardown | MEDIUM | Educational App Store review, Google Play, comparison articles |
| Mealime teardown | HIGH | Official mealime.com, ai-mealplan.com, multiple 2025 roundups |
| Paprika teardown | HIGH | Official paprikaapp.com, Plan to Eat comparison (competitor analysis), Flavor365 review |
| Plan to Eat teardown | HIGH | Official plantoeat.com learn docs, multiple 2025 roundups |
| Yummly | HIGH | Confirmed shutdown December 2024 via MealThinker, official Yummly site |
| Samsung Food / Whisk | HIGH | Samsung Global Newsroom announcement, official samsungfood.com, Plan to Eat review |
| MealFlow AI | MEDIUM | mealflow.ai blog (self-reported features — treat as marketing, not fully verified) |
| Innovation gaps | MEDIUM | Synthesized from gaps identified across verified competitor research |

---

## Sources

**Calendar Apps:**
- [Cozi App Review 2025: Features, Pricing & Is It Still Worth Using?](https://ourcal.com/blog/cozi-app-review-2025)
- [Cozi App Review 2026: Is It Still Worth It After the Pricing Changes?](https://www.usecalendara.com/blog/cozi-review-2026)
- [Best Cozi Alternatives 2025](https://getsense.ai/blog/posts/best-cozi-alternatives-2025.html)
- [Cozi Gold Features](https://www.cozi.com/cozi-gold-features/)
- [Why Families Love Cozi](https://www.cozi.com/why-families-love-cozi/)
- [TimeTree Review: Features, Pros & Cons, Pricing](https://toolstack.io/tools/timetree)
- [Google Calendar vs TimeTree](https://ourcal.com/blog/google-calendar-vs-timetree-features-pros-cons-and-best-option-for-2025)
- [TimeTree vs Cozi](https://cupla.app/blog/timetree-vs-cozi/)
- [Use a family calendar on Google](https://support.google.com/calendar/answer/7157782)
- [FamCal Review: The Ultimate Family Calendar Solution](https://bsimbframes.com/blogs/bsimb-blogs/famcal-ultimate-family-calendar-solution-busy-parents)
- [Best Family Shared Calendar App — 12 Picks for 2025](https://upbase.io/blog/best-family-shared-calendar-app/)

**Meal Planning Apps:**
- [Mealime Official](https://www.mealime.com/)
- [Paprika App Review 2025](https://flavor365.com/is-paprika-the-best-recipe-manager-app-for-you/)
- [Paprika App Review: Pros and Cons — Plan to Eat](https://www.plantoeat.com/blog/2023/07/paprika-app-review-pros-and-cons/)
- [Getting Started: The Meal Planner — Plan to Eat](https://learn.plantoeat.com/help/getting-started-using-the-meal-planner)
- [Yummly Shut Down: What Happened](https://mealthinker.com/blog/yummly-alternative)
- [Samsung Food Official](https://samsungfood.com/)
- [Samsung Announces Global Launch of Samsung Food](https://news.samsung.com/global/samsung-announces-global-launch-of-samsung-food-an-ai-powered-personalized-food-and-recipe-service)
- [Samsung Food Review: Pros and Cons](https://www.plantoeat.com/blog/2026/01/samsung-food-review-pros-and-cons/)
- [MealFlow AI Blog — Top Meal Planning Apps 2025](https://www.mealflow.ai/blog/top-meal-planning-apps-of-2025-simplify-your-meal-prep)
- [The Future of Family Meal Planning: AI Apps in 2025](https://ollie.ai/2025/10/05/best-meal-planning-app-2025/)
- [12 Best Meal Planning Apps for 2025](https://ai-mealplan.com/blog/best-meal-planning-apps)
- [6 Meal Planning Apps to Simplify Cooking and Cut Food Waste](https://conservefood.org/2025/07/02/6-meal-planning-recipes-apps-to-simplify-cooking-and-cut-food-waste/)
- [Best Recipe Apps for Social Media Imports](https://honeydewcook.com/blog/recipe-apps-social-media-imports)
- [Best Digital Family Calendar — Morgen](https://www.morgen.so/blog-posts/digital-family-calendar)
