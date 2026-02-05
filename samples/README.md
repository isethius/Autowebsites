# Sample Vibe Sites

This folder contains generated HTML samples for every supported vibe. Each file pairs a vibe with a distinct industry so the visual language is easy to compare.

## How to generate

1. From the repo root, run:

```bash
npx tsx scripts/generate-vibe-samples.ts
```

2. The script writes HTML files into `samples/` using the pattern `<industry>-<vibe>.html` and prints the DNA selection in the console.

## Current vibe/industry set

- executive + lawyer
- maverick + gym
- elegant + realtor
- bold + plumber
- friendly + dentist
- minimal + photographer
- creative + restaurant
- trustworthy + electrician
