# Write Test (Manual Verification) Workflow

There are no automated tests. All verification is manual in the browser.

## Steps

1. **Start the dev server**
   ```bash
   npm run dev
   # → http://localhost:5173
   ```

2. **Open DevTools** (F12) → Console tab. Keep it visible during testing.

3. **Verify the feature end-to-end** using the checklist in `testing.md`. Focus on:
   - The specific feature/fix you changed
   - Any adjacent systems that share state (e.g., changing item spawn logic → also test collision and HUD)

4. **Check for console errors** — zero errors and zero warnings is the target.

5. **Check edge cases**:
   - What happens at level start (fresh state)?
   - What happens when money hits $0?
   - What happens when lives hit 0?
   - Does the fix survive a level transition (state re-initialised via `getInitialState(event, nextLevel)`)?

6. **Test both players** — groom (arrow keys move, ↑/↓ ammo, Space shoot) and bride (A/D move, W shoot, S ammo) independently.

7. **Run lint**
   ```bash
   npm run lint
   ```

8. **Run production build**
   ```bash
   npm run build && npm run preview
   # spot-check the production build at http://localhost:4173
   ```

9. **Document result** — if everything passes, describe in your PR/commit what was tested and what the expected behaviour is.

## Tip: Speed up manual testing
- Press **N** (when all required items are acquired) to fast-forward row advances.
- Use browser DevTools → Sources to set a breakpoint in `useGameState.js` update loop to inspect live state.
- To test a specific level, temporarily change the `levelIndex` default of `getInitialState(event, levelIndex)`.
