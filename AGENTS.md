# Project Instructions

This repository is a throwaway material prototype. Optimise for a fast look-and-see loop, not for long-term stability or regression coverage.
This project aimed to test the shader effect before implement into UE5, this project use three.js but the prod use UE5, so we should keep align with the UE5 lighting model and prevent do too many customization on it.

## Language
- Write explanations and user-facing progress reports in Hong Kong Traditional Chinese (zh-HK).
- Write code, identifiers, and code comments in English only.

## Scope
- Build a Three.js material and shader sandbox: one page, local dev server, desktop browser.
- The page is gallery-first: it opens on the full preset gallery (planet mode), which then docks as a sidebar beside the viewport and the debug panel.
- Current surface: app modes `planet` (one master planet material, shape morphing, attachment meshes) and `material` (basic shapes); material modes `standard` (UE5 Default Lit) / `stylized` (PBR mixed with toon); preset gallery with thumbnails, live debug panel, corner orientation gizmo, orbit camera.
- Every preset carries a UE5 feasibility badge (`MI` / `SUB` / `EXTRA`) derived from the features it uses in `src/config/ueFeasibility.ts`. When you add a shader feature or an attachment, add its rule there.
- Use procedural geometry and procedural shaders. `three` is the only runtime dependency.
- Out of scope: external 3D or texture assets, audio, backend services, deployment, automated test suites, game mechanics.

## Art Direction
- Concept: 可愛い風 + Ace Combat 格好いい — cute and sci-fi at the same time.
- Shading target: realistic-leaning NPR, between full PBR and a full toon shader. Build on PBR features (GGX specular, metallic/roughness, IBL, shadows) and mix toon shading into them; do not replace PBR with a pure toon shader.

## Iteration
- Make the smallest change that shows the effect, then look at the result and adjust.
- Keep the app runnable at the end of every turn; do not leave a half-migrated state.
- Rewriting internal APIs is acceptable; there is no external consumer and no saved state.
- Ask before adding a dependency; the runtime is `three` plus Vite and TypeScript.
- Use yarn (v1) for every package command; do not use npm or commit a `package-lock.json`.

## Verification
- Run `yarn typecheck`. It is the only required gate.
- Run `yarn build` only when the change touches build config, `index.html`, or an import that only Vite resolves.
- For a visual change, look at the result once, in the dev server or a screenshot. Do not write an evidence ledger, a PASS/FAIL report, or delegate a review subagent.
- Do not change requested visual behaviour to satisfy a check; ask instead.

## Working Rules
- Read the file before changing it, and keep the existing module split: `config/`, `controls/`, `geometry/`, `materials/`, `shaders/`, `ui/`.
- Centralise tunables and defaults in `src/config/tuning.ts`. Use world units, seconds, and explicit degree/radian conversion.
- Keep the flow one-way: panel callback -> params object -> material or scene handle.
- Dispose Three.js resources and remove event listeners when their ownership ends. The page owns one renderer and one animation loop.
- Desktop-first. Do not invest in responsive layouts.
- Skills under `.agents/skills/` and references under `.agents/references/` are generic upstream material; project rules override them, and installing anything they suggest needs approval.

## Maintaining This File
- Keep only rules that change how the next agent works.
- Delete a rule when it stops matching the code; do not append contradicting revisions.
- Feature notes, tuning values, control mappings, and history do not belong here.
