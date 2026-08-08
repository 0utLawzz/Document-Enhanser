---
name: PNPM firewall and maturity
description: Replit package firewall and minimum-release-age behavior encountered when installing this workspace.
---

When a workspace install is blocked by a package tarball, keep PNPM's minimum release age enabled, choose the latest mature compatible release, refresh the lockfile, and install only the runnable workspace slice when unrelated tooling is not needed.

**Why:** This workspace's full install was blocked by `tsx` tarballs behind the package firewall; the DocBright artifact could be installed and run successfully through a focused filtered install without weakening supply-chain protections.

**How to apply:** For future setup or reruns, prefer `pnpm install --filter @workspace/docbright...` for the preview app, and avoid bypassing the release-age or firewall safeguards.

For sensitive document enhancement in Expo Go, keep processing local and use a pure-JavaScript codec/pixel pipeline rather than relying only on `expo-image-manipulator`, which can rotate/re-export but does not clean shadows or lighting.

**Why:** The sample government certificates need real shadow reduction and contrast correction on native mobile while preserving their exact content and avoiding third-party uploads.

**How to apply:** Preserve originals as immutable URIs, write enhanced copies to the device cache, and keep the browser and native enhancement profiles conservative and color-preserving by default.