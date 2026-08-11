---
name: feature-plan
description: Use this skill when the user wants to plan how to port or implement a feature from bbb_mobile_application into bbb_smart_system. Triggers on /feature-plan <feature>, "make a plan for <feature>", "how do I add <feature> from old app", "port <feature> to new app". Always use this when planning a feature migration between the two apps.
---

# Feature Plan

You are helping port features from the old app (`bbb_mobile_application`) into the new app (`bbb_smart_system`).

## Paths
- **Old app:** `/Users/mbp/Documents/GitHub/BBB/bbb_mobile_application`
- **New app:** `/Users/mbp/Documents/GitHub/BBB/bbb_smart_system`

## Steps

The user gives you a feature name (e.g., "offline storage", "GPS tracking").

1. **Search old app** — find relevant files, libraries, APIs used, and how it worked
2. **Search new app** — find what already exists and note the architecture patterns in use
3. **Output a plan** in this format:

---

## Feature: <name>

### Old App Implementation
- Files: <relevant files>
- Libraries/APIs: <list>
- How it worked: <2-3 sentence summary>

### New App Status
- Already implemented: <what exists, or "Nothing yet">
- Architecture to follow: <e.g., feature folders under ios/Sources/, RN bridge via NativeModules>

### Migration Plan
1. <Step 1>
2. <Step 2>
...

### Key Notes
- <Gotchas, API differences, deprecated libs to replace>

---

## Guidelines
- Follow new app's architecture — not old app's patterns
- Flag outdated libraries and suggest modern equivalents
- Reference specific files from both apps
- Don't implement — just plan
