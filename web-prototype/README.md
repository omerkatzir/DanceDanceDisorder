# Rhythm & Dance Disorders — physics prototype

Ten connected rigid bodies (nine with the head disabled), two planted feet, one input. TypeScript + Vite + Phaser 3 + Planck. Original blue Unity sprites are rendered over the physics bodies. No React, music, targets, scoring, color switching, particles, menus, or mobile packaging.

## Run locally

From the repository root, enter `web-prototype/`. This is an independent app; the legacy Unity export remains at the root in `index.html` and `Build/`.

For a fresh checkout with Node 22.12+ (or Node 24+) and pnpm:

```sh
cd web-prototype
pnpm install
pnpm dev
```

`pnpm build` type-checks and builds `dist/`; `pnpm preview` serves the production build; `pnpm test` runs deterministic physics checks. The lockfile pins installed versions. pnpm lifecycle scripts are disabled for esbuild; its platform-specific binary is installed as a dependency. 

## Play and tune

**Original sprites** toggles between the imported blue artwork and debug geometry. Pressing Space or starting a pointer hold picks expression 2, 3 or 4, just like the original controller; holding/releasing does not continually change the face. Repeats are possible, as in the original. Reset/presets return to expression 2. No heart targets or color changes are implemented.

The source PNGs are copied unchanged from `Assets/KidTextures` to `public/sprites/blue/`. Upper arm/thigh artwork preserves aspect ratio and fits prototype segment lengths. Forearms and shins use recovered Unity dimensions, collider offsets, sprite pivots and 300 pixels/unit at 0.75 scale. Their full sprite heights are 1.675 m and 1.765 m. Feet retain their floor anchors; the torso is raised to accommodate the longer shins. The shin artwork includes a wider shoe than its capsule collider, as in Unity. The head uses the original 300 pixels/unit and 0.75 scale. Sprites consume the same interpolated poses as the debug renderer; physics dimensions, forces and masses are unchanged.

The physical head and self-collisions are enabled by default. Two independent checkboxes at the top of the tuning panel allow a four-way comparison. Toggling the head rebuilds/reset the pose; toggling self-collisions preserves the current pose and refilters contacts live. Directly joint-connected bodies still do not collide. The head uses the original scaled circle radius (0.80125 m), neck offset (0.641 m above the hinge), mass 1 kg and a free neck hinge. Adjust its mass under Mass distribution. Neck angle limits remain disabled even if limb limits are enabled.

- Hold Space or a primary pointer on the play area to pull left; release to pull right.
- Keyboard focus on tuning widgets belongs to those widgets, so Space does not simultaneously control the dancer. Click the play area to return focus.
- Touch/pointer capture supports releasing outside the play area. Cancel, lost capture, blur and hiding the document clear input. Multiple touches are combined as one held state.
- Reset pose rebuilds the rig with current settings. Pause lets you inspect a pose. Presets reset the rig without rebuilding the app.
- **Wiggle:** symmetric world-horizontal force, mild damping, upward gravity.
- **Unity-inspired:** original 100 N idle / −200 N held, torso-local direction, equal masses, original damping and 50 Hz fixed ticks. This is an approximation: simplified limb geometry and solver substeps differ.
- **Loose noodle:** lighter arms and force shared between torso and arms.
- All sliders apply live. Positive gravity lifts, negative gravity falls. Joint limits are relative to the starting pose and disabled by default. Joint friction uses torque-limited zero-speed motors; zero leaves hinges free. There is no invented spring-stiffness setting on a rigid hinge.
- Actual compound fixture outlines, body centers, anchors and constraint connections are independently visible. Collider/joint overlays show the current solver state; filled bodies use interpolated presentation poses, so a slight discrepancy during motion is expected.
- The force arrow shows the net control force and torso application point. In distributed mode the torso receives 60%, four arm segments receive 10% each. In local mode the arrow can rotate away from the left/right input labels.
- The telemetry reports FPS, fixed tick frequency, solver substeps, tick count, unwrapped torso angle, maximum anchor separation and dropped catch-up time. Frame elapsed time is capped at 100 ms; no background backlog is replayed.

## Physics decisions

Planck is an MIT-licensed JavaScript/TypeScript rewrite of Box2D with revolute anchors, limits and torque-limited motors. This is the shortest route to an inspectable, tunable articulated chain. Its world is stepped independently inside the Phaser scene; Phaser owns canvas, scene lifecycle and rendering. No second Phaser physics engine runs.

Rapier (Apache-2.0) is a strong alternative with joints, motors, debug rendering and typed JS bindings, but adds asynchronous WASM initialization. Matter (MIT) offers convenient Phaser integration and adjustable distance/pin constraints; angular limits and hinge motors require more custom work. All are browser-capable; this ten-body prototype has no scale that warrants choosing on benchmarks. Planck's Box2D heritage, readable TS source and direct hinge API favor iteration here. This was an API/mechanic comparison, not a three-engine performance or game-feel bakeoff. Actual mobile device testing and packaging are deferred.

Primary references:

- [Planck source, TypeScript approach, license and web/mobile scope](https://github.com/piqnt/planck.js)
- [Planck revolute limits and motors](https://piqnt.com/planck.js/docs/api/classes/RevoluteJoint)
- [Rapier overview and Apache-2.0 license](https://rapier.rs/docs/)
- [Rapier JavaScript/WASM initialization](https://rapier.rs/docs/user_guides/templates/getting_started_js/)
- [Matter constraints and pin-joint behavior](https://brm.io/matter-js/docs/classes/Constraint.html)

## Code map

- `src/settings.ts`: defaults and experimental presets.
- `src/dancer.ts`: geometry, compound capsule fixtures, masses, hinges and force distribution.
- `src/physics.ts`: world, fixed ticks, solver substeps and reset. Force is applied on every solver substep. No control path sets body transforms.
- `src/input.ts`: the one-button state and event cleanup.
- `src/debug.ts`: live controls and telemetry.
- `src/presentation.ts` and `src/face.ts`: original sprite mapping and press-triggered face state.
- `src/main.ts`: Phaser scene and debug renderer. Filled geometry consumes interpolated physical poses; this is the eventual seam for presentation exaggeration. No animation framework yet.
- `tests/physics.ts`: stability, input response and timestep checks.
- `UNITY_REFERENCE.md`: recovered original values and deliberate deviations.

## Validation and limits

Production TypeScript/Vite build passes. The deterministic suite simulates nine scenarios for 90 seconds each: default, Unity-inspired, loose arms, unequal masses with limits, downward gravity, and high force with low solver iterations. All bodies stay finite and bounded, all scenarios respond across both sides, and maximum joint separation stays below 90 mm. With the head and self-collisions enabled, default measured worst separation is about 8 mm. The harshest tested setting measured about 63 mm. Arbitrary combinations of every extreme tuning value are not exhaustively validated.

30/60/144 Hz render schedules produce the same fixed-step result. Live mass/gravity changes, reset and long-frame capping pass. Lower fixed tick rates get more substeps to keep the solver at least 240 Hz; this fixed safety policy was added after the original-force preset stretched joints at 50 Hz. The UI displays the actual substep count.

The local server responds successfully and a preview was requested in Codex. Automated browser interaction, visual QA and physical mobile-device testing were not performed. Funny/satisfying feel is a human playtest question; the presets are starting points for that next iteration.
