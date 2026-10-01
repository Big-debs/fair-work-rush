# Fair Work Rush

A React and Phaser simulation that compares a live-in household worker's
agreed workday with the time, interruptions, and availability the day actually
requires.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm test
npm run build
```

## Phase 1 accounting rules

- Scheduled requests occur at their clock time, including during work, breaks,
  and sleep.
- An interrupted activity resumes after the request unless the day has ended.
- Active work, standby, on-call work, personal time, and sleep are recorded in
  separate buckets.
- **Extra requests received** measures requests explicitly marked as additional.
- **Work beyond agreed hours** measures total counted work above the contracted
  eight-hour day.
- The analytical effective rate includes active, standby, and on-call time. It
  is an explanatory comparison, not a conversion of the monthly contract into
  an hourly employment agreement.

## Phase 2 gameplay loop

Scheduled requests now pause the current activity and ask the player to choose
how to respond:

- **Do it now** protects household trust but raises stress and makes later
  requests more likely to expand.
- **Negotiate the timing** reduces the immediate workload and boundary pressure
  while introducing some tension.
- **Set a boundary** protects the worker's time but carries the largest
  short-term trust cost.
- **Accept and record it** completes the request and creates a record for a
  later conversation.

The HUD tracks worker wellbeing, household trust, and boundary pressure. The
results screen compares the agreement with the actual day and explains the
pattern created by the player's decisions.

## Phase 3 scenario journey

The prototype now supports a small, replayable narrative journey rather than a
single scripted shift:

- Six situations cover an ordinary day, unexpected visitors, care work, an
  interrupted day off, overnight demands, and a pay/responsibilities dispute.
- Three worker profiles and both live-in and live-out agreements make the same
  kinds of requests visible in different contexts.
- Each run includes one controlled event variation, selected predictably so
  playthroughs remain reproducible.
- Household trust, boundary pressure, worker confidence, completed situations,
  and the last debrief choice persist across days.
- Every results screen leads to an end-of-day conversation. Recorded requests
  make an evidence-led conversation more effective.

## Phase 4 visual and interaction system

Phase 4 replaces the prototype dashboard treatment with a warmer, editorial
household experience that remains legible on small phones:

- The playable scene now has an illustrated household, character-specific
  portraits, contextual task cards, and a palette that cools as pressure and
  fatigue increase.
- A shared agreement/reality timeline compares agreed time, counted work, and
  the current point in the day on the same scale.
- Tasks, interruptions, boundaries, and end-of-day outcomes collect in a live
  activity record beside the game and below it on narrow screens.
- Mobile devices receive a native 390 × 720 portrait scene rather than a scaled
  desktop canvas, with single-column decisions and minimum 44px DOM controls.
- Players can enlarge interface text and enable calm motion. System-level
  reduced-motion preferences are respected automatically.

### Realistic daily task rotation

The action cards are no longer a fixed breakfast/cleaning/laundry loop. A
39-task catalog rotates with the household clock: school preparation and runs,
infant care, dishes, bedrooms and bathrooms, market errands, lunch, snacks,
school pickup, homework, ironing, dinner service, children’s bedtime, kitchen
close, and preparation for the next day. Scenario-specific work adds visitor
hospitality, sick-child monitoring and medicine, live-out errands, and personal
activities on an agreed day off. Completed one-time work rotates out while
genuinely repeatable care and recovery can return.
