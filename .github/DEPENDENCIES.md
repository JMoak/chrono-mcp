# Dependency maintenance

Dependabot checks npm each Monday at 09:00 and GitHub Actions at 09:30,
America/New_York. Runtime and development minor/patch updates are grouped
separately. Major versions stay in individual PRs for compatibility review.
Routine npm releases wait 3 days for patches, 7 for minors, and 14 for majors;
Actions updates wait 7 days. Security updates have a separate group and bypass
these version-update cooldowns. Existing manifest ranges are preserved when a
lockfile update suffices.

`@types/node` stays on Node 22, the oldest supported runtime. Its major-version
ignore is intentional: update that constraint together with a deliberate change
to runtime support. Compiler and release-tool majors are reviewed individually;
the release tests exercise commit analysis, generated notes, and OIDC verification
so a tooling update cannot silently break publishing.

## Review and merge

- Require `ci` and `dependency-review` in the branch rules. `ci` aggregates Linux
  and Windows checks on Node 22, 24, and 26: lint, tests, build, MCP contracts, and
  package validation. The dependency-review job rejects newly introduced high or
  critical advisories across runtime and development dependencies.
- Actions use full commit pins with version comments; Dependabot updates those
  pins. PR jobs use read-only repository access and no release credentials.
- Inspect upstream release notes, manifest and lockfile changes, and all checks.
  A successful CI run is not approval for an automatic merge. No auto-merge
  workflow is installed.
- Run `npm audit` when reviewing updates. The PR diff check is not a replacement
  for periodically checking the entire existing dependency tree. Use
  `npm audit --omit=dev` to distinguish consumer dependencies from build tooling.
- Dependabot uses `chore(deps)` / `chore(deps-dev)` and therefore does not trigger
  chrono's conventional-commit release pipeline on its own. When a runtime
  dependency fix needs a published package, use an explicitly reviewed
  `fix(deps): ...` squash title; keep tooling-only updates as chores.

## Repository settings

The default branch must contain this configuration before scheduled updates run.
Keep the dependency graph, Dependabot alerts, and Dependabot security updates
enabled in GitHub's Code security settings. The YAML defines security grouping;
it cannot turn those repository features on. Branch-rule requirements also live
in GitHub settings and are separate from these workflow definitions.

References: [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
and [dependency review](https://github.com/actions/dependency-review-action).
