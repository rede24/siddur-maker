# Experimental RTL reader

Production stays on the simple reader. Work in `siddur-with-animations`; deploy only to the isolated `siddur-animations` Worker until user approval.

## Coordinate and gesture contract

The visible page is measured using its source image ratio and fitted inside the safe-area viewport. The engine always receives a single fixed-size portrait page. There is no 559px breakpoint, forced wrapper padding, or stretched scan.

StPageFlip's geometry stays LTR. The complete host is mirrored once; page content is counter-mirrored once. A forward Hebrew swipe (left to right) advances the logical index. The free corner follows pointer displacement at 1:1 speed. Completion is decided using the available on-screen drag distance, independently of the engine's two-page fold range; settling animates the remaining off-screen travel. A slow gesture no longer has to leave the screen to commit.

The previous-page gesture begins at the engine's portrait spine (halfway through its two-page range), so its sheet is visible immediately. Only Pointer Events own the gesture. Native StPageFlip mouse/touch handlers are disabled, avoiding its fast-swipe restart. Slow drags remain attached to the finger, small drags settle back, and flick velocity can complete a turn. A second finger cancels the fold and starts zoom; page turns are disabled while zoomed. The exposed paper back is lightly tinted, with faint reversed text showing through.

The current and destination images are decoded before folding. No transformed leaf uses native lazy loading. A failed destination load preserves the current page. Closing invalidates pending async work, releases the engine, and cancels animation frames.

## Local vendor changes

`public/vendor/page-flip.module.js` retains StPageFlip's geometry. Changes are limited to:

- Remove the previous RTL edit to native mouse coordinates (the adapter now owns RTL).
- Track the renderer's requestAnimationFrame and stop it on destroy.
- Remove resize listeners even when native mouse handling is disabled.
- Ignore delayed init callbacks for an already destroyed renderer.

The adapter calls the vendored controller's `start`, `do`, `reset`, and render cleanup methods. These are source-level integration points; verify this contract before upgrading the vendor. The adapter owns settling timing to keep slow drags and quick flicks on one continuous curve.

## Validation

`npm test` checks prayer/calendar composition. `npm run test:browser` runs Chromium and WebKit against real source pages, checking full-page geometry, forward/backward drags, cancel/flick behavior, page bounds, zoom, repeated reopening, rotation, missing images, and Chromium native touch/pinch interruption. CI captures resting and mid-fold screenshots for review.

Use the isolated preview on an actual iPhone before approving production. Browser emulation does not measure physical touch feel or Safari's OS-edge navigation gestures.

Offline browser tests stop a dedicated origin server; WebKit's offline emulation itself rejects service-worker responses (https://github.com/microsoft/playwright/issues/42775).
