# Deep Competitive Teardown: Chore Management & Home Coordination

**Domain:** Chore management, maintenance tracking, house rules, coordination
**Researched:** 2026-03-19
**Overall confidence:** HIGH (multiple verified sources across all competitors)

---

## 1. Competitor Teardowns

---

### 1.1 OurHome

**Platform:** iOS (4.5 stars), Android (3.9 stars)
**Target:** Families with children, couples, roommates
**Core thesis:** Make chores fun through gamification and point redemption

#### Chore Creation UX

Tasks are created with:
- Assignment: single person, multiple people, or rotating basis
- Due dates + recurring schedule options
- Reminder/notification times
- Late penalties (configurable)
- Point value per task

The rotation system lets you cycle through household members automatically. The UX is described as "a lot to learn" and "very busy/overly complicated" — feature-dense rather than minimal.

#### How Recurring Chores Work

Standard recurring patterns: daily, weekly, monthly, custom interval. The rotation feature cycles assignments across members — but this is the primary source of complaints. If one person misses their rotation day, OurHome does not advance the rotation correctly: it bumps chores to others and throws off the entire schedule. Users report having to reset the whole system when a child misses a chore day. Manual sort ordering also breaks after one day.

#### Completion Tracking

Tasks show as complete/incomplete per person per day. A task approval workflow exists so parents can verify before marking done. No photo proof feature confirmed (approval is manual/trust-based). The app's notification of others when tasks are completed was a frequently requested feature that was reportedly missing.

#### Gamification Mechanics

- Each task has a configurable point value
- Points accumulate in a household ledger
- Points are redeemed for rewards defined by parents: toys, outings, screen time, cash
- Rewards are set up by parents and unlocked when point thresholds are hit
- Late penalties can be applied (negative points)
- No leaderboard or household comparison visible

The point/reward system is what families love most. The ability to define real-world rewards (not just virtual) makes it tangible and motivating for kids.

#### Multi-Member Coordination

Private messaging hub within the app. Shared calendar for household events. Tasks visible to all members. Grocery list with smart suggestions. The calendar and messaging make it more than a chore app — but this adds to the complexity.

#### What Users Love

- Gamified point system motivates kids effectively
- Real-world rewards (not just virtual badges)
- Rotating assignments so no one person always gets the worst chores
- Grocery list that learns previous items
- Free tier is genuinely functional

#### What Users Hate

- Rotation breaks when anyone misses a day — requires manual reset
- Interface is cluttered and overwhelming to set up
- Sort ordering on chores doesn't persist across days
- Connectivity errors cause data loss
- Notifications are unreliable
- Too time-consuming for busy families who need simplicity

#### Key Insight for HomeOS

OurHome proves the model works (4.5 stars on iOS despite the bugs), but the rotation algorithm is fundamentally broken. A smart rotation that handles missed days gracefully — by either deferring, skipping, or reassigning without cascading failures — is a direct improvement opportunity.

---

### 1.2 Tody

**Platform:** iOS, Android (1M+ active users, cult following)
**Target:** Adults who want condition-based tracking, not deadline-based
**Core thesis:** Clean smarter, not harder — prioritize by actual need

#### The Indicator Method (Core Innovation)

Tody's fundamental breakthrough is replacing calendar-based scheduling with condition-based tracking. Instead of "mop the kitchen every Monday," you set a frequency (e.g., every 7 days) and Tody tracks elapsed time since last completion. A progress bar fills from green to yellow to red as time passes. No hard deadlines, no guilt for "missing" a day — just a visual indication of urgency.

This psychological shift is the key: missing a Monday doesn't make you "fail." It just makes the bar slightly more yellow. This reduces anxiety and shame spirals that kill consistency in deadline-based apps.

#### Visual Indicator System

Three-zone color bar system:
- **Green:** Recently cleaned, no attention needed
- **Yellow:** Getting due, intermediate priority
- **Red:** Overdue, highest priority

The bar progression is time-based relative to the set frequency. A room-level roll-up shows the worst-status task in each room, so you can glance at a room list and know instantly where attention is needed most.

#### Smart Prioritization

Tody generates a prioritized to-do list automatically: "what will give you the cleanest home with the least effort right now." Three cleaning mode presets:
- **Relaxed:** Longer suggested intervals
- **Standard:** Default intervals
- **Proactive:** Shorter intervals, higher standards

The AI-generated daily list eliminates decision fatigue. Users don't have to think about what to clean — the app tells them.

#### Time Estimates

Tody estimates time per task based on frequency and household size. Task entry includes estimated duration, allowing the app to present time-boxed cleaning sessions. This is a significant UX advantage for busy users who want to know "can I clean for 30 minutes right now and actually make a dent?"

#### Gamification: Dusty

"Dusty" is a dust ball mascot that drives monthly challenges. Users who engage with Dusty challenges show 30% higher consistency than those who disable gamification. Unlockable rewards tied to challenge completion. This is optional — users who find gamification patronizing can ignore it.

#### Multi-User: FairShare (2025 Update)

The 2025 FairShare update added:
- Visualization of workload imbalance between household members
- Shared leaderboards showing contribution percentages
- Task assignment and rotation schemes
- Data for "fair labor" conversations

The app tracks who is doing how much and makes it visible — addressing the invisible mental load problem with data.

#### Pricing

Free tier exists. Premium tiers: Solo, Duo, Family, Team (approximately $30/year for sync). Transition from one-time purchase to subscription in late 2024 generated significant user backlash.

#### What Users Love

- Condition-based psychology eliminates guilt and deadline anxiety
- Prioritized daily list removes decision fatigue
- Flexible for busy weeks (missing a day just shifts the bar, doesn't break the system)
- Applicable beyond cleaning: pet care, maintenance, seasonal tasks
- Dusty challenges genuinely increase consistency by 30%

#### What Users Hate

- Subscription model transition from one-time purchase angered existing users
- Risk of "app burnout" from over-configuring too many tasks
- Some users find it "too loose" — need hard deadlines for accountability
- Default frequency suggestions require customization immediately

#### Key Insight for HomeOS

The condition-based indicator model is the right psychological foundation for adult chores. Hard deadlines create guilt; condition bars create agency. HomeOS should adopt condition-based tracking as the default, with hard deadlines as an opt-in for users who prefer them. Tody's fatal flaw is that it's cleaning-only — HomeOS extends this model across all home management.

---

### 1.3 Sweepy

**Platform:** iOS, Android
**Target:** Neurodivergent users, ADHD households, families needing dopamine-positive motivation
**Core thesis:** Gamify cleaning into micro-achievements with immediate feedback

#### Chore Creation UX

Room-by-room structure. Users set up tasks within each room. Each task receives a point value (1-3 points):
- 1 point: Light tasks (dust surfaces)
- 2 points: Medium tasks
- 3 points: Heavy tasks (sweep and mop floors)

Tasks have frequency settings like Tody. The room-centric setup is more intuitive than a flat task list.

#### Cleanliness Meter

Visual progress bars per room and per task that move from green to red as time passes since last cleaning. Similar to Tody's indicator model but with more explicit "effort score" framing.

#### Smart Schedule Algorithm (2025)

Sweepy's AI examines all room Cleanliness Meters and generates a daily plan based on:
1. Which rooms are most urgent (reddest bars)
2. How much effort the user says they can expend that day

The user sets a daily effort target (e.g., "I can do 6 points today"). Sweepy selects the most impactful tasks to hit that target. This is "low-energy mode" scheduling — explicitly designed for days when you're exhausted.

In 2025, the algorithm began learning patterns: if someone consistently cleans the kitchen on weekend afternoons, it starts predicting and pre-scheduling this.

#### Gamification Mechanics

- Point accumulation per session
- Household leaderboard across members
- Virtual currency ("Sweepy Coins") to decorate a virtual home
- Audio "ding" sound on completion (dopamine hit)
- Visual progress animation on task completion
- "Work Approval" system: parents verify before awarding points

The virtual home decoration feature is underrated — it gives a tangible visual representation of a clean real home through a metaphorical virtual space.

#### Multi-User Features

Premium ($2.49/month or $12.99/year) unlocks:
- Unlimited household members
- Individual tracking per member
- Shared leaderboard
- Work Approval verification system

#### What Users Love

- Explicitly designed for ADHD and neurodivergent users — widely praised in that community
- Micro-task breakdown makes overwhelming jobs approachable
- Immediate audio and visual feedback provides dopamine
- Low-energy mode scheduling for difficult days
- Virtual home decoration is a fun motivation mechanic

#### What Users Hate

- Red bars for overdue tasks can trigger shame and anxiety — counterproductive for the ADHD audience it targets
- Default frequencies are aggressive and need immediate tuning
- Premium required for household coordination features

#### Key Insight for HomeOS

Sweepy solves the "energy level" problem that other apps ignore. Most chore apps treat all days equally — they don't account for illness, burnout, or high-stress periods. Offering an "energy level for today" input that adjusts the suggested task list is a low-effort, high-impact UX feature. The shame-spiral from red bars is a design flaw worth explicitly avoiding.

---

### 1.4 Homey (Chores + Allowance)

**Platform:** iOS, Android, Amazon
**Target:** Families with children who want to connect chores to financial education
**Core thesis:** Chores as financial literacy tool — money is earned, not given

#### Reward System Architecture

Homey distinguishes two chore types:
1. **Responsibilities:** Chores you do because you're part of the household — no payment
2. **Pay-based jobs:** Chores you do to earn money

This distinction is Homey's most important design decision. It mirrors real-world employment while also modeling household citizenship. Parents set which category each task falls into.

When pay-based chores are completed, the child earns money credited to an in-app wallet. Allowance can be:
- Paid automatically on schedule (weekly/monthly)
- Triggered by chore completion
- Held pending parent approval
- Transferred to a real bank account (US only)

Additional financial mechanics:
- Saving jars with named goals (e.g., "New bike" jar)
- IOU tracking
- Interest on savings (parent-controlled rate)
- Fines for misbehavior (negative balance)
- Per-minute rates for some tasks

#### Chore UX

Daily, weekly, monthly recurring or one-time tasks. High customization — frequency, amount, timing, approval required. The interface is described as "2018-era design" — functional but visually dated.

#### Family Coordination

- Parent dashboard for management and approval
- Child interface to view assignments and track earnings
- Family chat and push notifications
- Multiple children with separate wallets and task lists

#### What Users Love

- The responsibility vs. pay distinction is conceptually elegant
- Financial literacy connection makes chores feel meaningful
- Bank account linking for US families is powerful
- Goal-based saving with named jars motivates kids toward long-term goals

#### What Users Hate

- App crashes frequently, especially on premium features
- UI feels outdated and clunky
- No offline support
- $4.99/month feels expensive for the interface quality delivered
- Android stability much worse than iOS

#### Key Insight for HomeOS

Homey's responsibility vs. pay distinction is worth adopting for family mode. The concept of "baseline responsibilities vs. bonus tasks" maps onto adult households too: everyone is responsible for common area cleanliness, but someone who takes on extra tasks (organizing, deep cleaning) could earn credits toward something else (later bedtime, skip a turn at cooking).

---

### 1.5 Flatastic

**Platform:** iOS, Android (500K+ downloads)
**Target:** Roommates, flatshares, young adults in shared living
**Core thesis:** One app for chores + expenses + shopping — flatmate coordination

#### Feature Set

Flatastic is the most direct conceptual competitor to HomeOS's all-in-one approach:

- **Chore schedule:** Tasks with assignments, reminders, scoring system
- **Expense tracking:** Shared cost logging, automatic who-owes-whom calculation
- **Shopping list:** Shared list with smart suggestions, per-person item labels, multiple store lists, item photos
- **Pinboard:** Household bulletin board for notes, reminders, announcements
- **Points system:** Tracks how much each person has contributed visually

#### Chore UX

Tasks are created with person assignment and reminder times. The points/scoring system shows contribution percentages — making imbalances visible without accusation. One user quote: "the score system shows you how much everyone has done" and reduces arguments.

#### What Works

The combination of chores + expenses + shopping in one app is what users actually need. Reviews say: "this app literally changed our lives...we went from bickering about chores and a well-oiled machine where our house is always clean." The pinboard is low-tech but valued — a digital equivalent of the fridge whiteboard.

#### What Fails

- Timezone issues: chore statuses reset unexpectedly during the day
- Excessive ads: ad after every 2 completed tasks — users find this insulting
- Limited scheduling flexibility for complex recurrence patterns
- No condition-based tracking (just binary done/not-done with deadline)
- The app feels incomplete relative to its promise — each module is shallow

#### Rating Context

The 3.76 rating (Google Play) reflects the gap between promise and execution. Users download it hoping for a full-featured household OS, discover the modules are shallow, get annoyed by ads, and rate accordingly. The concept scores an 8/10; the execution scores a 3/10.

#### Key Insight for HomeOS

Flatastic validates the market demand for all-in-one household management — people download it specifically because they want everything in one place. The low rating is not a rejection of the concept but of the shallow execution. HomeOS's opportunity is to deliver the depth that Flatastic promises but doesn't deliver.

---

### 1.6 HomeRoutines / FlyLady

**Platform:** iOS (HomeRoutines: $4.99 one-time), Android (FlyLady app)
**Target:** Adults, primarily mothers, who struggle with household overwhelm
**Core thesis:** Build habit loops through zone-based routines and consistent small actions

#### The FlyLady System

FlyLady is a methodology before it's an app. The core ideas:
- **Zones:** House is divided into 5 zones, each gets attention one week per month
- **Routines:** Morning, evening, and weekly routines built as habit chains
- **15-minute bursts:** Never clean for more than 15 minutes at a stretch — prevents burnout
- **Progress, not perfection:** Showing up consistently beats occasional marathon cleaning sessions
- **Gold stars:** Visible acknowledgment of completing each routine step

#### HomeRoutines UX

Essentially a structured checklist app built around the FlyLady system:
- Repeating checklists grouped into labeled routines
- Focus Zone feature: each week highlights one zone of the house
- Timer built-in to enforce 15-minute bursts
- Achievements screen shows everything completed that day
- Automatically advances zones weekly, synced with FlyLady's published calendar

#### Habit Formation Mechanics

The gold star reward system is deceptively powerful. Checking off each task gives a small dopamine hit. The Achievements screen aggregates all completions so on low-motivation days you can see concrete proof of progress. This is a direct response to the "I did nothing today" feeling that kills consistency.

#### What Users Love

- The zone system prevents paralysis — you always know what to focus on this week
- 15-minute burst philosophy makes starting easy (low activation energy)
- Calendar sync with FlyLady's official system
- Gold stars feel silly but actually work as motivation
- $4.99 one-time purchase with no subscription pressure

#### What Users Hate

- iOS only (HomeRoutines) — Android users get the inferior FlyLady app
- Very rigid — built for FlyLady users, hard to adapt if you don't follow the system
- No multi-user coordination — entirely solo focused
- No collaboration features for households with multiple adults
- Dated UI

#### Key Insight for HomeOS

The zone-based rotation and 15-minute burst philosophy are proven habit-formation techniques that no modern household app has integrated properly. HomeOS should support zone-based weekly focus areas as an optional organizational layer on top of standard chore management. The 15-minute session mode (time-boxed cleaning with a timer) is a low-effort feature with high motivational payoff.

---

## 2. Maintenance Tracking Landscape

### HomeZada

The most comprehensive home maintenance tracking app:
- Automated maintenance schedule with seasonal task reminders
- Repair history logging: costs, contractor details, documents, before/after photos, dates
- Appliance inventory with warranty tracking
- Project management for improvements
- HomeZada AI for home-specific insights and recommendations
- Multi-property support (great for landlords)
- Pricing: Free (Essential), $99/year (Premium), $189/year (3 homes)

**What works:** The combination of maintenance schedule + repair history + appliance tracking in one place is genuinely useful for homeowners. The contractor detail logging (who did what, when, for how much) becomes invaluable over time.

**What fails:** Not integrated with daily chore management — maintenance is treated as separate from routine household tasks. No multi-user repair request workflow (one person submits, another approves, contractor is hired).

### Centriq

Appliance-centric maintenance tracking:
- Scan appliance model number or barcode to instantly get user manual, troubleshooting guides, parts info, safety recalls, how-to videos
- Add receipts, warranties, notes
- Set reminders for filter changes and maintenance tasks
- $32/year per property

**What works:** The barcode-scan-to-manual feature is a genuine time saver. Safety recall alerts are a safety feature most people would pay for.

**What fails:** Appliance-only focus. No repair request workflow, no contractor tracking, no integration with chore management.

### The Maintenance Request Gap

No consumer-facing app handles the full maintenance request workflow that households actually need:
1. Anyone in the household notices a problem (leaky faucet, broken appliance)
2. Problem is logged with photo/description
3. Someone is assigned to handle it (fix it themselves or hire out)
4. If hiring: contractor is contacted, quote recorded, work scheduled
5. Work is completed, cost recorded, receipt stored
6. History is preserved for future reference

This is the lifecycle that property management software (for landlords) handles well, but consumer home apps do not. HomeOS has a gap to fill here.

---

## 3. Innovation Opportunities

### 3.1 AI That Learns Per-Person Task Duration

**The problem today:** All apps assume all people take the same time to do the same chore. A 20-year-old athlete and a 70-year-old grandparent take different amounts of time to vacuum a house.

**The opportunity:** Track actual completion times per person per task. After 3-5 data points, the app knows: Alex takes 12 minutes to clean the bathroom, Sam takes 25 minutes. Fair rotation should account for time burden, not just task count. A "burden-balanced" schedule considers both frequency and duration.

**AI layer:** Predict upcoming availability constraints (calendar busy days) and pre-adjust the schedule. If Alex has three evening commitments next week, the AI proactively redistributes Alex's tasks to lighter days.

### 3.2 Condition-Based + Usage-Pattern Hybrid

**The problem today:** Tody uses time elapsed since last cleaning. But a kitchen used for heavy cooking every day gets dirtier than one where someone microwave-reheats takeout.

**The opportunity:** Usage-pattern weighting. The app learns: this household cooks 5 days/week, has a dog, has 4 people. Kitchen floor frequency should auto-increase. Bathroom frequency auto-adjusts for number of users. Guest room frequency drops to near-zero when no guests are scheduled.

**AI layer:** Track household patterns (cooking frequency, number of people home, seasonal factors) and dynamically adjust task frequencies without manual input. The user sets up once and the system learns.

### 3.3 Calendar-Integrated Optimal Day Scheduling

**The problem today:** Recurring tasks land on fixed days regardless of what's happening in people's lives.

**The opportunity:** Integrate with the shared household calendar. If Sam always works late on Wednesdays and has yoga on Saturdays, the AI never schedules Sam's chores on those days. If there's a guest arriving Friday, the system automatically advances guest room cleaning to Thursday.

**AI layer:** "Smart windows" — instead of "clean on Sunday," the AI finds the optimal day in a 3-day window that fits everyone's actual schedule. Guest arrival detection triggers a pre-visit cleaning burst.

### 3.4 Photo-Verified Completion with AI Grading

**The problem today:** Either trust-based (anyone can mark done) or manual parent approval (creates bottleneck).

**The opportunity:** Photo proof + AI verification. When marking a chore done, optional photo upload. AI analyzes the photo and rates completion quality: "Kitchen looks clean — counters clear, sink empty. Floor has visible crumbs near stove. Accept or request re-do?"

This removes the parent-as-judge bottleneck while maintaining accountability. Adult households can use it peer-to-peer: "photo proof required for shared spaces."

### 3.5 Mental Load Visibility Dashboard

**The problem today:** 71% of cognitive/emotional labor falls on one person even when physical tasks are split equally. Apps track who vacuumed but not who planned the grocery run, researched contractors, scheduled the plumber, or remembered the dentist appointments.

**The opportunity:** A "household contribution score" that accounts for:
- Physical task completion (tracked automatically)
- Planning tasks (manually logged: "researched 3 plumbers, made appointment")
- Mental load items (scheduled, remembered, coordinated)

Weekly summary: "This week Alex did 65% of physical tasks and 80% of planning tasks. Household average: Alex: 72%, Sam: 28%. Suggested rebalance: shift grocery planning to Sam."

### 3.6 Shame-Free Delinquency Handling

**The problem today:** Most apps either ignore missed tasks (builds up silently) or penalize them with red bars (triggers shame). The OurHome rotation-break problem is the worst version of this.

**The opportunity:** Graceful degradation design. When a task is missed:
- The task doesn't disappear or cascade-break the rotation
- The condition bar advances (gets more yellow/red) without alarming notifications
- If missed multiple cycles, a gentle "getting behind" nudge rather than an overdue alarm
- Makeup suggestions: "You're behind on bathroom deep clean. Want to pair it with your kitchen clean this Sunday for an efficient 45-minute session?"
- Rotation continues correctly regardless of who missed — the algorithm should be stateless per rotation cycle

### 3.7 Maintenance Request Workflow

**The gap:** No consumer app handles the full maintenance lifecycle.

**HomeOS opportunity:**
1. Any member can submit a maintenance request (photo + description + urgency level)
2. Request appears in a shared queue — all members can see it
3. Someone claims the task: "I'll fix this" or "We should hire out"
4. If hiring: contractor name, contact, quote, scheduled date tracked
5. Completion: cost recorded, receipt photo attached
6. History preserved: searchable log of everything fixed, when, by whom, for how much

When the landlord asks "was the dishwasher always making that noise?", you have an answer.

### 3.8 Zone-Based Weekly Focus with AI Load-Balancing

**The opportunity:** Combine FlyLady's zone system with AI load-balancing:
- House is divided into zones (kitchen, bathrooms, living areas, bedrooms, outdoor)
- Each week, one zone gets extra attention (deep clean vs. maintenance)
- The AI distributes zone tasks across household members based on availability
- 15-minute burst mode: timer-based sessions for users who get overwhelmed by open-ended cleaning

### 3.9 Seasonal and Event-Triggered Automation

**Seasonal triggers (auto-detected by date):**
- Spring: Add spring-cleaning tasks (windows, gutters, HVAC filter, outdoor furniture)
- Fall: Add winterization tasks (pipes, heating, outdoor plants)
- Summer: Increase AC filter check frequency

**Event triggers (from shared calendar):**
- Guest arriving → trigger pre-visit cleaning checklist
- Holiday dinner planned → trigger kitchen deep clean + extra grocery list items
- Long vacation → trigger pre-departure checklist (unplug, set thermostat, secure windows)

---

## 4. Recommended HomeOS Chore + Home Feature Spec

### 4.1 Chore System Architecture

#### Task Model

Every chore has:
- **Name + description** (rich text, with emoji support)
- **Assigned to:** specific person, rotating group, or anyone
- **Condition frequency:** "should be done every X days/weeks" (not a hard deadline)
- **Time estimate:** populated by user initially, refined by actual completion tracking
- **Effort weight:** 1-5 scale (used for fair load distribution)
- **Zone:** which area of the house (kitchen, bathroom 1, living room, etc.)
- **Category:** routine / deep clean / seasonal / maintenance / one-time
- **Photo required:** boolean — toggleable per task

#### Condition Indicator System (not deadlines)

Adopt Tody's condition-bar model as the default:
- Green → Yellow → Red gradient bar based on elapsed time vs. frequency
- No "overdue" alarm language — use neutral language: "Getting Due", "Needs Attention"
- Room-level roll-up: room card shows worst-status task as its color
- Home-level overview: quick-glance color health of entire house

Hard deadline mode available as a toggle for users who prefer it.

#### Smart Schedule Daily Suggestion

Each day, the app generates a suggested task list:
1. User inputs "energy level today": Low / Medium / High
2. App calculates effort budget (Low = 5 pts, Medium = 10 pts, High = 20 pts)
3. App selects highest-urgency tasks within the effort budget
4. Tasks are grouped by zone for efficiency (don't send someone upstairs twice)
5. Estimated total time shown: "Today's list: ~35 minutes"

#### Rotation Algorithm (stateless, failure-safe)

Design principle: the rotation must never break if someone misses a task.

Implementation:
- Rotation is determined at scheduling time: "for tasks of type X, cycle through [Alex, Sam, Jordan] in round-robin"
- Each rotation cycle is independent — cycle N does not depend on cycle N-1 being completed
- If a cycle is missed, it simply shows as incomplete in history but the next cycle assigns correctly
- "Fairness score" tracks who has completed vs. missed — surfaces imbalance without breaking rotation

#### Fair Load Balancing

Weekly dashboard showing:
- Tasks completed per person (count and time)
- Effort points per person
- Overdue tasks per person
- "Fair share" line: what equal distribution would look like
- Gentle suggestion if imbalance > 20%: "Sam has handled 70% of household tasks this week. Consider reassigning the weekend deep clean."

### 4.2 Gamification (Optional Layer)

Designed to be toggled off for adults who find it patronizing:

**Points system:**
- Each task completion earns XP based on effort weight × time
- Household members see a shared weekly leaderboard
- Monthly household "health score" (0-100) based on completion rate
- Streak tracking: consecutive weeks with balanced distribution

**Achievements:**
- "Spring Warrior" — completed all seasonal tasks
- "The Consistent One" — 30-day streak on daily routine
- "Fair Housemate" — within 10% of household average for 4 weeks running

**Household Rewards (family mode):**
- Parent defines redeemable rewards
- Points can be redeemed for rewards
- Responsibility tasks vs. bonus tasks distinction (from Homey)
- Savings goal visualization for kids

**Energy-level adaptation:**
- On low-energy days, completing even 3 tasks earns a "Showing Up" badge
- Prevents the shame spiral of "I didn't do anything today"

### 4.3 Photo Verification

For each task where photo is required:
1. On marking complete → camera prompt
2. Photo is attached to completion record
3. For parent/household-lead verification: photo appears in approval queue
4. AI pre-screening (v2): analyze photo, flag obvious issues ("counter has visible debris")
5. All completion photos stored in task history — shows before/after over time

Standard mode: photo optional, stored privately
Family mode: photo required for kids, parent approval flow
Peer mode: photo required for shared spaces, any household member can approve

### 4.4 Maintenance Request System

A separate module from chores, focused on the repair lifecycle:

**Submitting a request:**
- Title + description
- Category: Plumbing / Electrical / Appliance / Structure / Pest / Other
- Urgency: Immediate (safety issue) / Soon (affecting daily life) / Eventually (cosmetic)
- Photo(s) attached
- Visible to all household members immediately

**Request states:**
1. Open — submitted, unassigned
2. Claimed — someone is handling it
3. In Progress — contacted contractor / actively working
4. Pending (waiting on parts, waiting for contractor)
5. Resolved — work done, cost recorded
6. Deferred — acknowledged but deliberately postponed

**Resolution record:**
- Who resolved it
- Date resolved
- Cost (optional)
- Contractor name + contact (optional)
- Receipt photo (optional)
- Notes

**Appliance Registry:**
- Add appliances: name, brand, model number, purchase date, warranty expiration
- Manual barcode scan → auto-fetch manual (via Centriq-style lookup)
- Maintenance reminders attached to appliance: "Replace HVAC filter every 90 days"
- Warranty expiration alerts: "Dishwasher warranty expires in 30 days"
- Repair history linked to appliance

### 4.5 House Rules & Shared Agreements

A structured document layer (not a chat, not a chore):

**Rule types:**
- Quiet hours: configurable time windows with notification reminder
- Shared space policies: kitchen cleanup rules, common area standards
- Guest policies: advance notice required, maximum stay duration, registration
- Financial agreements: how utilities split, when rent is due reminder
- Parking/storage: who has which spaces

**Guest Management:**
- Any member can register a guest: name, arrival/departure dates, relationship
- Guest appears on household calendar
- Optional: guest notification checklist (clean guest room, buy coffee, etc.)
- Historical log of all guests (useful for lease-compliant guest policies)

**Shared Space Scheduling:**
- Book the living room, backyard, parking space for a specific time
- Visible to all members
- Automatic conflict detection: "Sam has the living room booked 7-10pm Friday"

### 4.6 AI Features (Prioritized by Impact)

**Tier 1 — Ship in v1 (high value, lower complexity):**

1. **Calendar-aware scheduling:** When suggesting task days, check household calendar for conflicts. Never schedule heavy chores on days with late events.

2. **Energy-level daily list:** User inputs energy level, app adjusts task load and selection accordingly.

3. **Graceful rotation:** Stateless rotation algorithm that never breaks on missed tasks.

4. **Guest arrival trigger:** When guest is added to calendar within 72 hours, surface a pre-visit cleaning checklist.

**Tier 2 — v2 (moderate complexity, high value):**

5. **Per-person time learning:** Track actual completion times. After 5 data points, use actual times for load balancing instead of estimates.

6. **Usage-pattern frequency adjustment:** Learn cooking frequency, household size changes, seasonal patterns. Suggest frequency adjustments quarterly.

7. **Seasonal task injection:** Automatically surface seasonal deep-clean and maintenance tasks at the appropriate time of year.

8. **Mental load tracking:** Allow manual logging of planning tasks and coordination work. Include in fair-distribution calculations.

**Tier 3 — v3 (high complexity, revolutionary):**

9. **Photo AI verification:** Analyze completion photos for quality. Flag obvious issues without requiring human review.

10. **Predictive maintenance:** Based on appliance age, usage history, and manufacturer schedules, predict when maintenance is needed before failure.

11. **Conflict pattern detection:** Identify recurring friction points (same chore consistently missed by same person, maintenance requests clustering in one area) and surface insights.

### 4.7 UX Principles Derived from Competitor Research

1. **Condition bars, not deadlines.** Elapsed-time indicators with green/yellow/red are psychologically healthier than overdue countdowns. (from Tody)

2. **Never break the rotation.** Missed tasks must not cascade or corrupt future assignments. (OurHome's fatal flaw)

3. **Energy-aware scheduling.** Always ask "how much energy do you have today?" before presenting the task list. (from Sweepy)

4. **Visible contribution data.** Show who is doing what without accusation — let data speak. (from Flatastic's score system, Tody's FairShare)

5. **Zone-based efficiency.** Group tasks by physical location for efficient execution. Suggest "kitchen cluster" rather than scattered tasks. (from FlyLady/HomeRoutines)

6. **Shame-free language.** Never use "overdue," "failed," "missed." Use "Getting Due," "Needs Attention," "Waiting for You." (anti-pattern from Sweepy's red bars)

7. **Time transparency.** Always show estimated total time for a suggested task set. "Today's list: ~40 minutes" enables realistic planning. (from Tody's time estimates)

8. **Real rewards in family mode.** Virtual points only work when connected to real-world rewards that parents define. (from OurHome and Homey)

9. **Separation of responsibilities vs. bonus tasks.** Some tasks are household citizenship (everyone's baseline), some are above-and-beyond (earn credits). (from Homey)

10. **No ads in a task-completion flow.** An ad after completing 2 tasks is a product-destroying decision. Premium model must be subscription-only. (Flatastic's critical error)

---

## 5. Synthesis: The Ultimate HomeOS Chore + Home System

The market gap is clear: every existing app gets one or two things right and fails at the rest.

| App | Gets Right | Fails At |
|-----|-----------|---------|
| OurHome | Gamification, rewards, family coordination | Rotation algorithm, complexity, reliability |
| Tody | Condition-based tracking, prioritization, time estimates | Single-user focus, cleaning-only, subscription backlash |
| Sweepy | Energy-adaptive scheduling, ADHD-friendly, micro-rewards | Shame spiral design, premium-gated coordination |
| Homey | Responsibility vs. pay distinction, financial literacy | Outdated UI, crashes, no maintenance |
| Flatastic | All-in-one concept, score visibility | Shallow modules, ads, poor execution |
| FlyLady | Zone system, habit formation, 15-min bursts | Solo-only, no modern multi-user design |
| HomeZada | Maintenance tracking depth, contractor history | Not integrated with chores, no daily coordination |

HomeOS wins by doing all of the above in one coherent system:
- Tody's condition-based tracking model
- Sweepy's energy-adaptive daily scheduling
- OurHome's gamification and rewards (with a working rotation algorithm)
- Homey's responsibility vs. bonus task distinction
- FlyLady's zone-based focus and 15-minute sessions
- HomeZada's maintenance lifecycle tracking
- Flatastic's all-in-one concept (but with depth)
- Plus AI features none of them have built

The AI differentiation is not the starting point — it is the compounding advantage that builds over time as the app learns each household's patterns, personalities, and preferences. The foundation must be excellent without AI; the AI makes it extraordinary.

---

## Sources

- [OurHome App Review — Noobie](https://noobie.com/ourhome-app-review/)
- [OurHome Reviews 2025 — JustUseApp](https://justuseapp.com/en/app/879717020/ourhome-chores-and-rewards/reviews)
- [OurHome Problems 2026 — JustUseApp](https://justuseapp.com/en/app/879717020/ourhome-chores-and-rewards/problems)
- [Tody App Review 2025 — Tidied Blog](https://www.tidied.app/blog/tody-app-review)
- [Tody — Make peace with your cleaning routine](https://todyapp.com/)
- [I Tried This Cleaning App — Apartment Therapy](https://www.apartmenttherapy.com/tody-cleaning-app-review-37282867)
- [Sweepy App Review 2025 — Tidied Blog](https://www.tidied.app/blog/sweepy-app-review)
- [I Tried Sweepy — Apartment Therapy](https://www.apartmenttherapy.com/sweepy-cleaning-app-review-37027260)
- [Homey App — Official Site](https://www.homeyapp.net/)
- [Homey Chores and Allowance — Common Sense Media](https://www.commonsensemedia.org/app-reviews/homey-chores-and-allowance)
- [Flatastic — Official Site](https://www.flatastic-app.com/en/)
- [FlyLady App — App Store](https://apps.apple.com/us/app/flylady-routines-cleaning/id1115477521)
- [HomeZada — Home Maintenance](https://www.homezada.com/homeowners/home-maintenance)
- [Centriq App](https://apps.apple.com/us/app/centriq/id1115477521)
- [Lividly — The Fair Way to Manage Your Home](https://lividly.app/)
- [DuoDo — AI Calendar & Task Planner](https://www.getduodo.com/)
- [7 Best Chore Apps for Couples 2025 — Tidied Blog](https://www.tidied.app/blog/best-chore-apps-couples)
- [ChoresAI Smart Family Tasks — App Store](https://apps.apple.com/us/app/choresai-smart-family-tasks/id6747013648)
- [Homeowners Guide to AI-Powered Cleaning Schedules 2026 — Joy of Cleaning](https://joyofcleaning.com/homeowners-guide-to-ai-powered-cleaning-schedules-that-actually-work-in-2026/)
- [Best Free Chore Apps 2025 — MyChoreBoard](https://www.mychoreboard.com/blog/best-free-chore-apps-2025/)
- [Fair Interval Scheduling of Indivisible Chores — arXiv](https://arxiv.org/html/2402.04353)
- [Best Home Maintenance Apps — Select Home Warranty](https://www.selecthomewarranty.com/blog/best-home-maintenance-apps/)
