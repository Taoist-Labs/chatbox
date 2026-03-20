# Wamo Review Branding Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Apple-review-facing upstream branding and support links so the review build presents itself consistently as Wamo Chat.

**Architecture:** Keep the change set narrow and deterministic. Update only the help menu, package metadata, and user-visible support email strings, then lock the behavior with focused regression tests and residual-string scans.

**Tech Stack:** TypeScript, Electron, Vitest, JSON locale resources

---

## Chunk 1: Lock Metadata Expectations

### Task 1: Add failing branding regression tests

**Files:**
- Modify: `src/electron-builder-config.test.ts`
- Modify: `src/package-version-config.test.ts`
- Create or Modify: `src/menu-branding.test.ts`

- [ ] **Step 1: Write failing tests for review-facing branding**

Add assertions for:
- help menu no longer referencing `github.com/chatboxai/chatbox`
- release package author email/url using Wamo values
- root package repository URL using `https://wamo.caboroca.xyz/`

- [ ] **Step 2: Run targeted tests to verify failure**

Run: `pnpm test src/electron-builder-config.test.ts src/package-version-config.test.ts src/menu-branding.test.ts`
Expected: FAIL on old upstream links/metadata

## Chunk 2: Implement Minimal Branding Cleanup

### Task 2: Replace review-facing menu links

**Files:**
- Modify: `src/main/menu.ts`
- Test: `src/menu-branding.test.ts`

- [ ] **Step 1: Update help menu labels and links**

Set help items to:
- `官方网站` -> `https://wamo.caboroca.xyz/`
- `反馈问题` -> `https://wamo.caboroca.xyz/`

Remove upstream GitHub repo/issues links.

- [ ] **Step 2: Run targeted menu tests**

Run: `pnpm test src/menu-branding.test.ts`
Expected: PASS

### Task 3: Replace package metadata

**Files:**
- Modify: `release/app/package.json`
- Modify: `package.json`
- Test: `src/package-version-config.test.ts`

- [ ] **Step 1: Update release author metadata**

Set:
- `author.email` -> `m9iaujigj@mozmail.com`
- `author.url` -> `https://wamo.caboroca.xyz/`

- [ ] **Step 2: Update root repository metadata**

Set:
- `repository.url` -> `https://wamo.caboroca.xyz/`

- [ ] **Step 3: Run metadata tests**

Run: `pnpm test src/package-version-config.test.ts`
Expected: PASS

### Task 4: Replace user-visible support email strings

**Files:**
- Modify: `src/renderer/i18n/locales/*/translation.json`

- [ ] **Step 1: Replace `hi@chatboxai.com` with `m9iaujigj@mozmail.com` in user-visible locale strings**

- [ ] **Step 2: Verify residual review-facing strings**

Run: `rg -n 'hi@chatboxai.com|github.com/chatboxai/chatbox|chatboxai.com|chatboxai.app' src/main/menu.ts release/app/package.json package.json src/renderer/i18n/locales`
Expected: no matches in touched review-facing files

## Chunk 3: Final Verification

### Task 5: Run focused verification suite

**Files:**
- Verify only

- [ ] **Step 1: Run focused tests**

Run: `pnpm test src/electron-builder-config.test.ts src/package-version-config.test.ts src/menu-branding.test.ts`
Expected: PASS

- [ ] **Step 2: Run residual-string scan**

Run: `rg -n 'github.com/chatboxai/chatbox|hi@chatboxai.com|chatboxai.com|chatboxai.app' src/main/menu.ts release/app/package.json package.json src/renderer/i18n/locales`
Expected: no matches

- [ ] **Step 3: Commit implementation**

```bash
git add src/main/menu.ts src/electron-builder-config.test.ts src/package-version-config.test.ts src/menu-branding.test.ts release/app/package.json package.json src/renderer/i18n/locales
git commit -m "chore: clean review-facing upstream branding"
```
