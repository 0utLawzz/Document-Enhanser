---
name: PNPM firewall and maturity
description: Replit package firewall and minimum-release-age behavior encountered when installing this workspace.
---

When a workspace install is blocked by a package tarball, keep PNPM's minimum release age enabled, choose the latest mature compatible release, refresh the lockfile, and install only the runnable workspace slice when unrelated tooling is not needed.

**Why:** This workspace's full install was blocked by `tsx` tarballs behind the package firewall; the DocBright artifact could be installed and run successfully through a focused filtered install without weakening supply-chain protections.

**How to apply:** For future setup or reruns, prefer `pnpm install --filter @workspace/docbright...` for the preview app, and avoid bypassing the release-age or firewall safeguards.