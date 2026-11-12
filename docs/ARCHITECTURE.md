# Architecture

## Round state and visible rooms

The logical round and the visible room are separate. Three observation-hall instances and four connectors are recycled along a diagonal route. Four corners between adjacent observation halls hide room preparation from both ends.

Entering the connector's central buffer prepares a candidate destination. It does not consume the anomaly deck or change the active score. Reversing inside that buffer restores the same original hall, anomaly and number. Arriving at the far numbered landing commits the candidate exactly once, before the next observation hall is visible.

A newly entered hall is rotated to its entry direction. Normal posters remain on the left and equipment doors on the right. Turning around inside a round does not rotate that room. This is a full 180-degree rotation, not mirrored artwork.

The first passage and every reset to 00 show the normal reference. Normal mode communicates progress through physical signs; easy mode explains an incorrect choice after commitment. Reaching 08 reveals a physical stairwell; the player must climb it to finish.

## Rendering

Three.js renders procedural ceramic walls, terrazzo flooring, ceiling panels, labels and posters generated with Canvas. Area lights, two shadow-casting spotlights, a blurred planar reflection, bloom, fog, filmic tone mapping and restrained color grading establish the scene.

Repeated fixed box details are instanced within their original parent groups so anomaly visibility and transforms stay independent. Texture sources are shared across recycled rooms. Warmup prepares textures, shader variants and shadows before entering.

| Preset | Shadow map | Reflection | Bloom | Main pixel budget |
| --- | --- | --- | --- | --- |
| Smooth | 512 | Off | Off | 0.9 million |
| Balanced | 768 | 512 | Subtle | 1.6 million |
| High | 1024 | 768 | Subtle | 3 million |

The presets preserve scene geometry and anomaly cues. The adaptive controller measures real frame intervals, lowers resolution during sustained slow frames and recovers gradually after stable performance. It targets 60 FPS without guaranteeing it on every device.

Static shadows are invalidated when rooms, anomalies or quality change. The watcher's slow motion refreshes its shadows at a bounded rate. Paused, settings, intro and ending screens render on demand, and hidden tabs stop drawing.

Canvas resizing clears the drawing buffer. Resize requests are therefore coalesced and applied immediately before rendering, in the same frame callback. Resizing after a completed render would present a blank frame. Unchanged dimensions do not reallocate buffers.

## Stairs

`stairs.js` defines the dimensions shared by visible treads, the smooth collision ramp and the handrail profile. The rail consists of lower horizontal, sloped and upper horizontal segments. Support bottoms sit on actual tread surfaces, and their tops intersect the rail. The same local profile works in either room orientation.

## Audio and input

Web Audio synthesizes the ambient chord loop, station hum, air and footsteps. Audio scheduling runs independently of drawing. SpeechSynthesis selects a device voice matching the current Chinese, English or Japanese language. Captions remain available when a matching voice is missing or audio is muted. No audio assets are fetched.

Keyboard, pointer, joystick and virtual-key inputs feed the same movement model. Pause, focus loss and pointer cancellation clear held inputs. Preferences are validated and stored locally; game progress lasts only for the current session.

## Localization

`i18n.js` contains all three message catalogs, locale negotiation and voice matching. Automatic language selection follows the browser's preferred-language order, with English as the fallback. An explicit selection is stored alongside the existing preferences. Menus, accessibility labels, announcements, easy-mode explanations, posters and physical signs use the same selected locale.

Language switching updates DOM text and cached Canvas textures in place. It does not reload the page, reconstruct geometry, change the anomaly deck or commit a connector preview. All pooled halls and connectors refresh their labels while retaining their current numbers and orientation. New textures upload while the menu is open and are shared between rooms; revisiting a language reuses its cache. Normal mode never exposes anomaly descriptions.

## Verification

The Node test suite covers domain rules, reversible previews, immediate anomaly returns, forward/reverse room orientation, connector collision and sightline occlusion, settings, resolution budgets, adaptive scaling and rail joints. Browser checks are still needed for actual shader output, sound, touch input and frame pacing.

For black-frame regressions, sample the WebGL framebuffer immediately after the game's animation callback while inducing automatic resolution changes. Inspect the resize frame itself: a screenshot taken several frames later can miss the defect. Pixel readback stalls the GPU, so this check is not a frame-rate benchmark.
