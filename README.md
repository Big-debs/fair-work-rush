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
