# Wamo Review Branding Design

**Date:** 2026-03-15

## Goal

Reduce App Store guideline 4.3(a) "repackaged app" risk by removing user-visible and package-visible upstream `Chatbox` branding from the Wamo Chat review build, without changing product behavior.

## Scope

This design only covers Apple-review-facing branding cleanup:

- Help menu labels and links in the desktop shell
- User-visible support email strings
- Release package metadata that may be extracted from the binary/package
- Root package repository metadata that currently points to the upstream project

Out of scope:

- Internal comments, historical docs, and README files
- Large-scale text replacement across the entire repository
- Feature changes, auth flow changes, or UI restructuring

## Approved Decisions

### Branding Targets

- Product name remains `Wamo Chat`
- Support email becomes `m9iaujigj@mozmail.com`
- External help/support URLs become `https://wamo.caboroca.xyz/`

### Help Menu Structure

Replace upstream-oriented help items with product-oriented items:

- `官方网站` -> `https://wamo.caboroca.xyz/`
- `反馈问题` -> `https://wamo.caboroca.xyz/`

Remove the `Github Repo` jump entirely.

### Metadata Cleanup

Update package metadata that Apple or users may inspect:

- `release/app/package.json`
- root `package.json`

The release package should no longer expose `chatboxai` email/URL values.

## File Responsibilities

- `src/main/menu.ts`: Owns desktop help menu labels and external links.
- `release/app/package.json`: Owns release package author/contact metadata.
- `package.json`: Owns root repository metadata used during packaging/tooling.
- `src/renderer/i18n/locales/*/translation.json`: Stores user-visible support email strings.
- Tests under `src/*.test.ts`: Lock review-facing branding invariants.

## Data Flow

1. Desktop help menu renders review-visible support/navigation entries.
2. Runtime error strings render user-facing support contact details.
3. Packaging metadata is read from package manifests during release assembly.
4. Regression tests assert the configured links and package metadata no longer reference upstream branding.

## Error Handling

- No new runtime branches are introduced.
- If a support link cannot be opened, existing Electron behavior remains unchanged.
- Translation replacements remain string-only edits, minimizing regression surface.

## Testing Strategy

- Add/extend metadata tests for root and release package branding fields.
- Add/extend menu tests to assert upstream GitHub links are gone and Wamo URLs are present.
- Use targeted `rg` verification after edits to confirm no review-facing `chatboxai` residues remain in the touched surfaces.

## Risks

- Over-cleaning developer-only references wastes time without improving review outcomes.
- Under-cleaning visible metadata weakens the response to 4.3(a).

This design intentionally targets the smallest set of high-signal review-facing artifacts.
