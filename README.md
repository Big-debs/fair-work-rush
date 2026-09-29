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
