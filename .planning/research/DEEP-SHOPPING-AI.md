# Deep Research: Shopping Lists, Supply Tracking & AI Household Intelligence

**Scope:** Competitive teardown of shopping/inventory apps + AI capability landscape
**Researched:** 2026-03-19
**Overall confidence:** HIGH (official sources, verified with multiple data points)

---

## Part 1: Shopping App Competitor Teardowns

### 1. AnyList — The Gold Standard for Grocery + Recipes

**Pricing:** $9.99/year individual, $14.99/year household (AnyList Complete). Core list-sharing is free.

**What the free tier includes:**
Creating and sharing lists, voice commands (Siri/Alexa), Apple Watch support, online shopping integration, widgets, and up to 5 recipe imports.

**What users pay for (Complete tier):**
- Unlimited recipe imports from any website
- Full meal planning calendar with drag-and-drop
- Web access (Mac/PC) — free tier is mobile-only
- Location-based reminders ("remind me when I'm near Trader Joe's")
- Custom themes and passcode protection

**Sharing mechanism:**
Real-time sync across all devices. Multiple household members can add, check off, and modify lists simultaneously. Items checked off appear crossed out instantly on all other devices — not refreshed in batch. This "watching it happen" quality is what users specifically praise.

**Recipe integration (the real differentiator):**
- Imports ingredients from thousands of websites with a single URL paste
- Automatically combines duplicate ingredients across recipes (3 recipes needing garlic = one "6 cloves garlic" line item)
- Recipe scaling (0.5x, 2x, any multiplier) with quantity recalculation
- "Cooking mode" for step-by-step in-kitchen use
- December 2025 update added: personalized recipe suggestions ("Ideas" tab), recipe Queue, and meal plan search

**Store-specific organization:**
Users define custom grocery categories that map to their local store layout (e.g., "Produce → Dairy → Frozen → Checkout"). Items auto-sort into user's defined aisle order when added to list.

**What users hate:**
- Recipe import breaks on Pinterest and many smaller blogs (URL parser fails silently)
- No data export (no CSV, no Google Sheets sync) — lock-in risk
- Android experience is noticeably inferior to iOS
- App is English-only
- Customer support response times reported as very slow

**Why users pay $14.99/year:**
The meal plan → recipe → combined ingredient → sorted grocery list pipeline is frictionless once set up. It eliminates the "what are we having this week + what do we need to buy" workflow almost entirely. The value is time saved per week, not features per se.

**Confidence:** HIGH — official feature pages verified, user complaints from App Store/Trustpilot

---

### 2. OurGroceries — Reliable Sharing, Minimal Friction

**Pricing:** Free with ads. One-time "remove ads" IAP (~$4.99) that covers the entire shared household — a genuinely user-friendly model.

**Sharing mechanism:**
True real-time sync (within seconds) across all connected household members. Anyone can add to any shared list. No account required for guests — share via household code.

**Category management:**
Items automatically group by category. Users can edit categories per item. No explicit "store layout" mapping, but aisle-based grouping is available. Items can have photos and notes attached.

**What makes it distinct from AnyList:**
OurGroceries added **AI photo item recognition** — take a photo of a product and AI identifies it and adds to list. This is more frictionless than typing for pantry restocking scenarios (photograph what's running low).

**Voice assistant integrations:** Alexa, Siri, Google Assistant — all three, unlike AnyList which focuses on Apple ecosystem.

**Recipe and to-do features:**
Recipe storage and ingredient-to-list conversion exist but are less polished than AnyList. The to-do list feature adds some household management utility beyond groceries.

**What users love:** It just works. Cross-platform parity (Android/iOS/web). One-time payment model. Real-time updates.

**What users dislike:** Less polished UI than AnyList. Recipe import is limited. No meal planning calendar.

**Confidence:** HIGH — official user guide, App Store descriptions, comparison verified

---

### 3. Grocy — Household Inventory ERP (Power Users Only)

**What it is:** Self-hosted, open-source household management system. "ERP beyond your fridge" is literal — it's enterprise resource planning concepts applied to a home. Free to use, but requires self-hosting (Docker, NAS, Raspberry Pi, or cloud VPS).

**Inventory tracking approach:**
The core loop is:
1. Scan barcode when purchasing → item added to stock with purchase date, quantity, best-before date
2. Scan barcode when consuming → item removed from stock
3. Define minimum stock levels per product → system auto-generates shopping list when stock drops below minimum
4. Expiration dates tracked → items approaching expiry surfaced as "due soon"

This consume-on-use model is uniquely powerful but requires consistent discipline from all household members.

**Barcode scanning:**
- Camera-based scanning in browser (no app required)
- External barcode reader support via USB/Bluetooth
- Open Food Facts integration — scan unknown barcode → product details auto-populated (name, nutrition, image)
- Batch scanning mode for fast unpacking groceries

**Shopping list generation:**
Automatic: when any tracked product falls below its defined minimum stock level, it automatically appears on the shopping list. This is the killer feature — you never need to manually remember to add items; the system adds them based on consumption reality.

**What else Grocy tracks:**
Chores (schedule, assign, track completion), equipment and maintenance records, battery replacement schedules, recipes with pantry availability checking, and meal planning with automatic shopping list population.

**What users hate about Grocy:**
- Setup requires technical knowledge (Docker, server administration)
- 16+ menu options on first launch — overwhelming for non-technical users
- All household members must consistently scan items in/out — if one person doesn't scan, data corrupts
- No cloud-hosted option (third-party Grocy.de exists but raises privacy/reliability concerns)
- The discipline required is the biggest barrier — most households fail within weeks

**The lesson for HomeOS:**
Grocy proves the concept — minimum stock thresholds auto-generating shopping lists, consumption-based tracking, recipe integration with pantry awareness — but the UX barrier is too high for mainstream adoption. HomeOS should steal the logic without the complexity. Make it feel like Grocy's brain in AnyList's body.

**Confidence:** HIGH — official site, GitHub, Hacker News community discussion, Sourceforge reviews

---

### 4. Bring! — Visual Shopping, European Design Sensibility

**What makes it distinct:**
Bring!'s entire UX philosophy centers on visual item selection rather than text-based search. Common grocery items have recognizable icons — users tap icons to add items, reducing friction for non-typists (children, elderly, non-native language speakers).

**Icon-based UX:**
Rather than "type 'bananas'" the interface presents a visual catalogue of common items. Tapping an icon adds it. This is faster for recurring standard items but slower for unusual or niche products.

**Store organization:**
Bring! uses product type categorization (customizable icons) rather than physical aisle layouts. This suits users who think in product categories rather than store geography.

**Cross-device ecosystem:**
Full parity across iOS, Android, smartwatch, tablet. Strong European user base suggests multi-language support is excellent.

**Recipe-to-list:**
Import ingredients from popular recipe websites directly to shopping list with single tap.

**What Bring! gets right:**
The visual, approachable interface makes shopping feel less like data entry and more like tapping a menu. Reduces cognitive friction for casual users.

**What Bring! lacks:**
No pantry/inventory tracking. No meal planning calendar. No AI-based suggestions. Primarily a beautiful list app, not a household intelligence platform.

**Confidence:** MEDIUM — cross-referenced from Listonic comparison page + App Store descriptions; no direct official source fetched

---

### 5. Listonic — AI Suggestions + Speed-First UX

**AI shopping suggestions:**
Listonic's AI learns from personal shopping history to pre-fill lists. The stated logic: "If 70% of your shopping habits stay the same week to week, the system remembers what you bought." This means list creation progressively speeds up — after 4–6 weeks, creating a standard weekly shopping list takes seconds.

**The AI Assistant feature:**
Users describe what they want ("easy, tasty, cheap") and the assistant suggests products and recipes. This is LLM-style natural language interaction applied to shopping, not just autocomplete.

**Smart list templates:**
The system builds personalized templates from shopping history that users can tweak rather than rebuild from scratch each week.

**UX philosophy:**
Speed-first, text-driven. The opposite of Bring!'s visual approach. Designed for users who want to get through list creation as fast as possible.

**What Listonic misses:**
No meal planning calendar. No pantry inventory. Limited recipe management. Strong on the shopping act itself, weak on the broader household food lifecycle.

**Confidence:** MEDIUM-HIGH — official Listonic feature pages, comparison articles from their own site (self-promotional, but feature claims are specific)

---

### 6. Out of Milk — Shopping + Pantry Duality

**Three-list model:**
Out of Milk has a genuinely different model: Shopping list, Pantry list, and To-do list as separate but linked concepts.

**Pantry tracking:**
Users explicitly maintain a pantry list — items with quantity, price, and category. When an item is purchased and checked off the shopping list, you can move it to the pantry. When pantry stock is consumed, you manually mark it down. This is a softer version of Grocy's approach — no barcode scanning, no automatic threshold triggers, but a clear "what do I have" reference.

**What the pantry feature does well:**
- Spices and staples tracking ("do I have paprika?")
- Prevents buying duplicates of pantry items
- Visual snapshot of kitchen inventory

**What it does poorly:**
- Still manual — no automatic "add to shopping list when low"
- No barcode scanning
- No minimum stock threshold automation
- UI is considered functional but dated

**Sharing:**
Real-time sync across household. Free for core features.

**Why it matters for HomeOS:**
Out of Milk proves users want the shopping/pantry duality even without full automation. The concept works; the implementation is just incomplete.

**Confidence:** MEDIUM-HIGH — official feature pages, Apartment Therapy review, App Store description

---

### Competitor Landscape Summary

| App | Sharing | Recipe | Pantry/Inventory | AI | Meal Plan | Price |
|-----|---------|--------|------------------|----|-----------|-------|
| AnyList | Real-time, excellent | Best in class | No | Minimal | Yes (paid) | $14.99/yr |
| OurGroceries | Real-time, excellent | Good | No | Photo ID | No | $5 one-time |
| Grocy | Real-time | Good | Best in class | No | Yes | Free (self-host) |
| Bring! | Real-time | Import only | No | No | No | Freemium |
| Listonic | Real-time | Limited | No | Shopping suggestions | No | Freemium |
| Out of Milk | Real-time | No | Manual only | No | No | Free |

**The gap no competitor fills:** Real-time shared lists + automated pantry inventory + intelligent meal planning + predictive restocking + deep AI — all in one frictionless package. This is HomeOS's opportunity.

---

## Part 2: AI Capability Research

### 2.1 Receipt and Document AI

**What GPT-4o, Claude, Gemini can do with receipts in 2026:**

The state of the art has moved far beyond basic OCR. Modern LLM vision models treat receipts as structured documents to interpret, not just images to transcribe.

**Accuracy benchmarks (2025-2026):**
- Tabscanner (purpose-built receipt API): 99% accuracy on well-structured receipts
- GPT-4o coupled with OCR preprocessing: ~91% on mixed receipt types
- Gemini (native vision): ~94% — highest of the three major LLMs due to integrated vision architecture
- Claude Sonnet: ~90% on printed media, slightly lower on handwritten

**What these models can extract:**
- Merchant name, address, phone
- Transaction date and time
- Payment method (cash, card, specific card type)
- Individual line items with quantity, unit price, extended price
- Subtotal, tax (broken down by tax rate if applicable), total
- Discount and coupon amounts
- Store loyalty program identifiers

**Handwritten receipts and edge cases:**
GPT-4 class models excel at using contextual clues to decipher messy handwriting — e.g., if a partial word could be "milk" or "mills," context from surrounding items makes the correct interpretation likely. Claude handles complex document layouts better than most, preserving structure even on crumpled or skewed photos. Foreign language receipts: all three major models handle Latin-script foreign languages well; CJK character receipts require either fine-tuned models or specialized OCR preprocessing.

**Faded, crumpled, or partial receipts:**
Quality degrades predictably. Gemini/GPT-4o with image preprocessing (contrast enhancement, perspective correction) achieves workable results on moderately degraded receipts. Severely faded thermal receipts (>18 months old) have success rates below 60%.

**Practical architecture for HomeOS:**
Use a tiered approach: (1) purpose-built receipt OCR API (Tabscanner or Klippa) for structured extraction at 99% accuracy, (2) fallback to GPT-4o vision for complex/unusual receipts where structured API fails, (3) user confirmation UI for line items the AI flags as low-confidence. This achieves near-perfect accuracy in practice.

**What this unlocks for HomeOS:**
Photograph a grocery receipt → all purchased items appear in pantry inventory, expenses split automatically, shopping list cleared of purchased items. One photo does the work of three manual workflows. This is a magic moment.

**Confidence:** HIGH — benchmarks from Koncile AI comparison study, Klippa documentation, Tabscanner spec sheets

---

### 2.2 Predictive Household Consumption AI

**The core prediction problem:**
Given a household's purchase history for a product, predict when they will run out. Input: purchase dates, quantities purchased, household size. Output: estimated depletion date + recommended reorder date.

**What actually works:**
For regular-consumption items (toilet paper, dish soap, coffee), linear consumption rate models are surprisingly accurate. A household that buys a 6-pack of paper towels every 3 weeks will continue that pattern. The algorithmic challenge is handling irregular items (seasonal, event-driven, variable quantity).

**Amazon's Subscribe & Save approach:**
Amazon does not automatically predict when households run out. The replenishment interval is customer-chosen (1–6 months), with Amazon's ML used primarily for logistics optimization (batching shipments) and encouraging customers to add more items to hit discount tiers. This is important context — the "AI knows when you'll run out" narrative is largely marketing; the actual implementation relies on customer-defined schedules.

**What HomeOS should do instead:**
Rather than pure prediction, use a consumption-rate model seeded by purchase history and adjusted by user feedback. After a household tracks 3–4 purchase cycles of any item, the system can estimate consumption rate. Then:
- 7 days before predicted depletion → add to shopping list automatically
- User sees "System added: Dish soap (est. 5 days remaining)" and can accept, dismiss, or adjust timing

This is predictive restocking done right: transparent, adjustable, and anchored to real consumption data rather than manufacturer-suggested schedules.

**The data flywheel:**
Every receipt scan adds to the consumption dataset. More data → better predictions → more accurate restocking alerts → less manual inventory management. The product gets smarter the longer a household uses it.

**Research confidence:** MEDIUM-HIGH — AI demand forecasting literature, Amazon Subscribe & Save documentation, smart home research from Frontiers journal

---

### 2.3 AI Meal Planning

**What the best AI meal planners do in 2026:**

The SOTA in AI meal planning (as of early 2026) has moved past simple "generate a recipe list." Top apps like Ollie, Fitia, and FoodiePrep:

1. **Take household preferences as structured input:** dietary restrictions, cuisine preferences (including culturally specific cuisines), foods each member dislikes, allergy flags
2. **Consider pantry inventory:** filter recipes to maximize use of what you already have, minimize new purchases
3. **Apply budget constraints:** weekly grocery budget → select recipes accordingly, cheapest first, then by preference match
4. **Nutritional balancing:** meet macro targets and micronutrient coverage across the week, not per meal
5. **Variety enforcement:** actively prevent repeating the same protein source more than N times in a week
6. **Dynamic adjustment:** if Tuesday's planned meal is swapped, regenerate the rest of the week's plan to maintain nutritional balance

**Cultural food handling:**
Fitia is the standout for Latin American cuisine accuracy. Most apps still underrepresent non-Western cuisines. This is a real gap for multicultural households — the AI defaults to Mediterranean/American templates even when preferences indicate otherwise. An LLM-based approach (GPT-4o, Claude) handles this significantly better than traditional ML-based meal planners because the training data includes global food knowledge.

**What HomeOS should do:**
Use an LLM backend (GPT-4o or Claude) with structured prompts that encode: household members' preferences, current pantry state, weekly budget, nutritional targets, and day-by-day calendar constraints (e.g., "Tuesday is a busy day, max 20 min prep"). Return a structured meal plan with shopping list delta (what to buy to execute this plan given what you already have). This is meaningfully better than rule-based systems.

**The shopping list delta is the key insight:**
"Given these 7 dinners and your current pantry, you need to buy: [12 items]. You already have: [8 items]. Estimated cost: $47."

**Confidence:** HIGH — Ollie 2025/2026 reviews, Fitia documentation, FoodiePrep feature set, academic research on AI nutrition recommendation systems

---

### 2.4 Conversational Household AI

**What exists in 2026:**

Google replaced Google Assistant with Gemini for Home (October 2025 rollout). Gemini Live now handles multi-step household reasoning: "I have spinach, eggs, cream cheese, and smoked salmon — what should I make?" → generates recipe options with step-by-step instructions.

GE Appliances' SmartHQ: photograph fridge contents → instant recipe suggestions powered by Google Cloud generative AI.

Samsung Bespoke fridges (CES 2026): internal cameras + Gemini API → full fridge inventory awareness, recipe suggestions, expiry alerts. (Previous Vision AI only recognized 37 food items; Gemini integration upgrades this to near-arbitrary item recognition.)

Home Assistant's local AI agent (September 2025 release): on-device LLM integration for privacy-preserving household control.

**What HomeOS can build:**
A household chatbot that has deep context about the household's state:
- "What should we cook tonight?" → knows current pantry, dietary preferences, day of week, past meals
- "Who owes the most right now?" → queries expense data, returns balance summary
- "Schedule a deep clean for Saturday" → creates chore assignments from cleaning task templates
- "Are we running low on anything?" → queries pantry state, returns items below threshold
- "Add everything on this receipt" → processes photo, adds to expenses/pantry

The difference between HomeOS's conversational AI and generic ChatGPT is **context**. HomeOS has household-specific data (balances, pantry, chore history, preferences) that no general-purpose AI has. This is the moat.

**Implementation reality:**
This is achievable via a standard LLM API (OpenAI, Anthropic, or Gemini) with a well-designed system prompt that includes relevant household context. "Tool use" function calling lets the LLM read/write HomeOS data. No custom model training required. The hard part is context management — what household state to include in each query without exceeding token budgets.

**Confidence:** HIGH — Google official Gemini for Home announcement, GE Appliances press release, Samsung CES 2026 announcement, Home Assistant official blog

---

### 2.5 AI for Fairness in Chore Allocation

**The research gap:**
There is no commercially deployed product specifically using algorithmic fairness for household chore distribution as of early 2026. Aida (UX Design Awards 2023 winner) came closest — AI scanning detects cleaning tasks, estimates time, optimizes scheduling — but the product did not achieve mainstream adoption.

**What can be measured:**
- Hours contributed per member (if tasks have time estimates)
- Task frequency per member (how often each person's name appears in completion history)
- Task type diversity (are high-effort tasks distributed or concentrated?)
- Compliance rate (assigned vs. completed, by member)

**Practical fairness implementation:**
Rather than complex ML fairness algorithms, HomeOS should use transparent, explainable fairness metrics visible to all household members. A "fairness score" calculated weekly from hours contributed, task completion rate, and task difficulty. Make the score visible and discussable — social accountability is more effective than opaque algorithmic enforcement.

The AI's role: suggest rebalancing when scores diverge beyond a threshold. "Alex has contributed 3.2 hours this week, Sam has contributed 0.8 hours. Would you like to reassign some of Sam's tasks?"

**Confidence:** MEDIUM — Academic algorithmic fairness literature, Aida case study, market research

---

### 2.6 Computer Vision for Pantry/Fridge Scanning

**Current state (2026):**

FridgeVisionAI: Users take up to 5 photos of fridge and pantry → AI creates organized digital inventory with expiration tracking. Product exists and is functional.

Samsung's evolution: Started with recognition of 37 items (April 2025), upgraded to Gemini integration at CES 2026 enabling near-arbitrary item recognition.

The technical limitation: reading barcodes vs. recognizing items visually are different problems. Visual food recognition (an apple is an apple) works well. Identifying specific product SKUs from package appearance without a barcode is less reliable. Expiration date reading from photos requires high-resolution images and good lighting.

**For HomeOS's purposes:**
The photo-based fridge scan is a first-run experience feature, not a daily workflow. Use it to seed the pantry inventory on initial setup. For ongoing tracking, barcode scanning at purchase time (or receipt scanning) is more reliable and requires less friction.

Alternatively: OurGroceries already does "take a photo of an item → AI identifies and adds to list." HomeOS should match this at minimum, and extend it to "take a photo of nearly-empty bottle → AI identifies it and adds to shopping list."

**Confidence:** HIGH — FridgeVisionAI official site, Samsung official newsroom, Computer vision research from basic.ai

---

### 2.7 AI Smart Notification Timing

**What's technically possible:**

Send-time optimization is well-established in marketing tech (Braze, OneSignal, and others have offered it since 2022). The model: observe when each user opens and engages with the app → build per-user engagement probability curves across 24-hour day → send notifications in each user's high-engagement window.

For household apps specifically:
- Most people check shopping lists before leaving for work and while at the grocery store
- Chore reminders are most effective in the morning (setting intention) or right before a user is typically home
- Financial notifications land best when users aren't commuting

**Implementation complexity for HomeOS:**
Low. Standard ML approach: collect notification open timestamps per user → fit a time-of-day engagement model per user → schedule notifications accordingly. Libraries and APIs exist (OneSignal has this built in). Custom implementation is a week of engineering work.

The smarter opportunity: **context-aware reminders**. "Buy milk" reminder when the user is near a grocery store (geofencing). Chore reminder when all household members are home for the first time that day. These are more valuable than timing optimization alone.

**Confidence:** HIGH — Braze/OneSignal documentation, habit tracking research, Emergn ML notification article

---

## Part 3: Best-in-Class Synthesis

### What each competitor gets right (steal this)

| Source | What to steal |
|--------|---------------|
| AnyList | Recipe-to-ingredient-to-sorted-list pipeline; automatic ingredient combining; store-layout category sorting |
| OurGroceries | AI photo item recognition; cross-platform parity; one-time-pays-for-household pricing model |
| Grocy | Minimum stock thresholds → automatic shopping list addition; consume-on-use inventory model; Open Food Facts barcode lookup |
| Bring! | Icon-based visual shopping for accessibility; cross-device including smartwatch |
| Listonic | Purchase history → progressive list pre-fill; explicit AI assistant for shopping suggestions |
| Out of Milk | Three-state model (pantry / shopping / to-do); pantry as "what I have" reference |

### What none of them do well (HomeOS's gap)

1. **Household-aware AI that knows everything:** No competitor connects pantry state + expense data + chore history + meal preferences into one AI brain.
2. **Receipt → everything:** No competitor processes a receipt and simultaneously updates: expense ledger, pantry inventory, shopping list completion. Each does one piece.
3. **Predictive restocking with transparency:** Grocy has threshold-based automation but no ML prediction; others have no inventory at all.
4. **Fair task distribution with visibility:** Zero competitors quantify household contribution fairness.
5. **Conversational household interface:** No consumer app has a household chatbot with deep household state context.

---

## Part 4: The Magic Moments

These are the features where users would say "I can't go back to doing this manually":

### Magic Moment 1: The Receipt Photo That Does Everything

User photographs grocery receipt → HomeOS:
- Extracts all line items (99%+ accuracy with Tabscanner + GPT-4o fallback)
- Splits the expense among household members per configured rule
- Adds purchased items to pantry inventory
- Clears those items off the shopping list
- Updates consumption rate models for predictive restocking

**One photo. Three manual workflows eliminated. This is the highest-leverage AI feature in the product.**

### Magic Moment 2: "What should we cook tonight?"

User asks HomeOS chatbot. System:
- Queries current pantry inventory
- Filters recipes where all/most ingredients are already on hand
- Applies household preference filters (dietary, cuisine, members present tonight)
- Returns 3 options ranked by "fewest items to buy"
- User selects one → missing ingredients auto-added to shopping list

The magic is that it "knows" — knows what's in the fridge, knows who's home, knows what was cooked in the past week, and won't suggest pasta for the third night.

### Magic Moment 3: The Shopping List That Builds Itself

User never needs to manually add staples. The system tracks consumption rates and automatically adds items 5–7 days before predicted depletion. User opens shopping list and sees it pre-populated with what they actually need, ranked by urgency.

Combined with geofence reminders: as they approach a grocery store, the list surfaces with a notification.

### Magic Moment 4: Barcode Scan Pantry Update

User unpacks groceries and scans barcodes (or uses batch-scan mode). Each scan: Open Food Facts lookup for product details, adds to pantry stock, increases consumption rate model sample size. Under 3 seconds per item. Takes 90 seconds for a typical grocery run.

Combined with receipt scanning, the barcode scan becomes the fallback for non-standard items or stores with faded receipts.

### Magic Moment 5: Fairness Dashboard

Household sees a weekly summary: who contributed how many hours to chores, who's been carrying more weight in groceries, balance of shared expenses. No accusations — just visible data. The AI suggests rebalancing. Social accountability through transparency, not enforcement.

### Magic Moment 6: The Expense + Pantry Link

Household member buys household supplies → marks as household expense → items appear in shared pantry → running balance updated. The connection between "spending money on supplies" and "tracking those supplies" becomes automatic. No more "I spent $45 on paper towels but nobody reimbursed me" because the system captured it.

---

## Part 5: Recommended HomeOS Shopping + AI Specification

### Shopping List Core (Must Have — Phase 1)

**List creation:**
- Real-time shared list (all members see additions/removals instantly via WebSocket)
- Smart autocomplete learning from purchase history (after first 2 weeks)
- Voice input via device voice assistant integration
- Quick-add from pantry view ("add to shopping list" button per item)

**Organization:**
- Auto-sort by store-defined category order (user sets once, system applies always)
- Multiple lists supported (each store, different household contexts)
- Item notes, quantity, preferred brand fields

**Completion workflow:**
- Check-off with haptic feedback; crossed-out but visible (undo-able)
- "Shopping mode" collapses checked items to bottom
- After shopping, one-tap "move to pantry" for all checked items

**Geofencing:**
- Notify assigned household member when near configured store
- Configurable per-store radius

### Pantry / Inventory (Must Have — Phase 2)

**Stock tracking:**
- Barcode scan via camera (Open Food Facts lookup for name, image, nutrition)
- Receipt scan → bulk pantry addition
- Manual add with quantity and unit
- "Running low" / "Out" status flags (user-set thresholds OR AI-inferred from consumption rate)

**Consumption modeling:**
- After 3 purchase cycles: system estimates consumption rate and depletion date
- Configurable "days before depletion → add to shopping list" trigger (default: 7 days)
- Transparent: user always sees "System added X because estimated Y days remaining"

**Expiration tracking:**
- Optional expiration date on items
- 3-day warning before expiry with notification
- "Use first" flag for items approaching expiry

**Barcode experience:**
- One-hand scan mode: camera auto-triggers on barcode detection, no button press
- Batch mode: continuous scanning for unpacking groceries
- Haptic + audio feedback on successful scan
- For unrecognized barcodes: manual entry form pre-populated with barcode number

### AI Meal Planning (Must Have — Phase 2/3)

**Input:**
- Per-member preference profiles (cuisines liked, foods disliked, dietary restrictions, allergies)
- Household weekly food budget
- Calendar constraints (busy days = quick meals, special occasions = elaborate)

**Output:**
- 7-day dinner plan (can extend to all meals)
- Shopping list delta (what to buy given current pantry)
- Estimated cost for the week

**Implementation:**
- LLM backend (Claude or GPT-4o) with structured system prompt containing pantry state, preferences, and constraints
- Return structured JSON: meal per day, with recipe name, prep time, ingredients needed, ingredients available
- Cache meal plans (regenerating for every view is wasteful and expensive)

**User control:**
- Swap individual days (regenerates that day, preserving rest of plan)
- Lock in meals user wants to keep
- "Surprise me" for maximum variety
- "Use what I have" mode — maximize pantry consumption, minimize purchases

### Receipt AI (Must Have — Phase 1)

**Architecture:**
1. User photographs receipt
2. Primary: Tabscanner API (99% accuracy, purpose-built, fast)
3. Fallback: GPT-4o vision for receipts that fail structured extraction
4. Return: structured JSON with merchant, date, line items (name, quantity, price), total, payment method
5. User review screen: confirm line items before committing to expense + pantry

**What the receipt scan triggers:**
- Expense record created with all line items
- Household member sees confirmation of split
- Detected grocery items matched against product database → added to pantry
- Those items removed from shopping list if present

**Edge cases to handle:**
- Multi-category receipts (grocery + non-grocery items at Target/Costco) — flag non-grocery for manual categorization
- Foreign receipts — LLM fallback handles most Western European languages
- Faded/partial receipts — request better photo with guidance overlay

### Conversational AI (Phase 3 — Advanced)

**Interface:**
- Persistent chat interface accessible from main navigation
- Natural language input with voice option
- Household context injected into every query: pantry state, upcoming calendar, current balances, recent chores

**Supported intent classes:**
- Food/cooking queries: "What can I make with chicken and broccoli?"
- Inventory queries: "Do we have any pasta?"
- Shopping queries: "Add bananas to the list"
- Financial queries: "Who owes the most right now?"
- Scheduling: "Remind me to clean the bathroom Saturday morning"
- Chore assignment: "Schedule weekly cleaning tasks"

**Implementation:**
Function calling / tool use against HomeOS API. LLM acts as orchestrator:
- `get_pantry_state()` → what's in stock
- `get_expenses()` → current balances
- `add_to_shopping_list(item, quantity)` → add items
- `create_chore_task(description, assignee, due_date)` → task creation
- `generate_meal_plan(constraints)` → trigger meal planning

System prompt includes household profile snapshot. Keep prompt under 2000 tokens for cost control.

### AI Notifications (Phase 2)

**Smart timing:**
- Collect notification engagement timestamps per user
- After 14 days: fit time-of-day preference model per user
- Send reminders in each member's engagement window
- Never send during configured Do Not Disturb hours

**Contextual triggers:**
- Geofence: enter radius of grocery store → shopping list notification
- Time-based: morning briefing ("3 items added to list since yesterday, 2 items running low")
- Chore reminders: evening notification for incomplete due-today tasks
- Fairness alert: if one member's contribution drops below 50% of household average for 7 days → private nudge

**Anti-patterns to avoid:**
- Never more than 3 notifications per day per user (notification fatigue kills retention)
- Every notification must be actionable (not just informational)
- Users must be able to silence any category of notification

---

## Sources

- [AnyList Features](https://www.anylist.com/features)
- [AnyList Complete](https://www.anylist.com/complete)
- [AnyList December 2025 Release Notes](https://help.anylist.com/articles/release-notes-anylist-dec-2025/)
- [OurGroceries User Guide](https://www.ourgroceries.com/user-guide)
- [OurGroceries FAQ](https://www.ourgroceries.com/faq)
- [Grocy Official Site](https://grocy.info/)
- [Grocy GitHub](https://github.com/grocy/grocy)
- [Listonic vs Bring! Comparison](https://listonic.com/compare-apps/listonic-vs-bring)
- [Listonic Product Suggestions](https://listonic.com/f/product-suggestions)
- [Out of Milk Features](https://outofmilk.com/features/)
- [Homechart Official Site](https://homechart.app/)
- [HomeOS Competitor](https://ourhomeos.app/)
- [Claude vs GPT vs Gemini on Invoice Extraction — Koncile AI](https://www.koncile.ai/en/ressources/claude-gpt-or-gemini-which-is-the-best-llm-for-invoice-extraction)
- [GPT-4o Receipt Extraction — Towards Data Science](https://towardsdatascience.com/how-to-effortlessly-extract-receipt-information-with-ocr-and-gpt-4o-mini-0825b4ac1fea/)
- [Klippa Receipt OCR](https://www.klippa.com/en/ocr/financial-documents/receipts/)
- [Gemini for Home — Google Blog](https://blog.google/products/google-nest/gemini-for-home/)
- [GE Appliances SmartHQ AI — Pressroom](https://pressroom.geappliances.com/news/ge-appliances-transforms-daily-life-with-ai-powered-kitchen-laundry-and-shopping-innovations)
- [Samsung AI Vision CES 2026 — Samsung Newsroom](https://news.samsung.com/global/samsung-to-unveil-ai-vision-built-with-google-gemini-at-ces-2026)
- [FridgeVisionAI](https://fridgevisionai.com/)
- [AI Meal Planning Apps 2026 — Ollie](https://ollie.ai/2025/10/29/best-meal-planning-apps-2025/)
- [AI Meal Planning Worth It 2026 — Fitia](https://fitia.app/learn/article/ai-meal-planning-apps-worth-it-2026/)
- [AI Grocery Personalization 2025 — AI Journal](https://aijourn.com/how-artificial-intelligence-is-personalizing-grocery-recommendations-in-2025/)
- [AI in Home Assistant — Home Assistant Blog](https://www.home-assistant.io/blog/2025/09/11/ai-in-home-assistant/)
- [AI Smart Notifications — Emergn](https://www.emergn.com/insights/smarter-approach-notifications-ml-ai/)
- [AI Demand Forecasting 2025 — InDataLabs](https://indatalabs.com/blog/ai-demand-forecasting)
- [Aida AI Household Chores App — UX Design Awards](https://ux-design-awards.com/winners/2023-2-aida-an-ai-powered-app-for-household-chores)
