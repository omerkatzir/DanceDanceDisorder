# Recovered Unity physics reference

Inspected read-only from the original `AutomaticDancer` Unity source project (separate from this repository’s WebAssembly export). Unity version stored in binary assets: 2018.2.13f1. Scenes and project settings are binary serialized Unity files; decoded with UnityPy, not guessed from scripts. `EditorBuildSettings.asset` enables `Assets/Scenes/Test3.unity`; `Test1`, `test2` and `New Scene` are alternatives. This report prioritizes Test3.

## The important discovery

`ProjectSettings/Physics2DSettings.asset` has gravity **(0, +5)**, pointing upward in Unity. This supplies the inflatable recovery force. Two static foot anchors resist the upward acceleration. The dancer does not rely on upright motors or a hidden pose animation for its basic recovery.

## Project-wide values

| Parameter | Original |
|---|---|
| Fixed timestep | 0.02 s / 50 Hz |
| Maximum allowed timestep | 0.333333 s |
| Gravity | x 0, y +5 |
| Velocity / position iterations | 8 / 3 |
| Max linear correction | 0.2 |
| Max angular correction | 8° |
| Max translation / rotation speed | 100 / 360 |
| Layer collision matrix | All 32 entries are 0xffffffff |
| Joint connected collisions | Disabled on all 11 Test3 hinges |

## Test3 rig

10 dynamic bodies: Body, Head, two Hand_U, two Hand_D, L/R_Leg_U and L/R_Leg_D. Two additional static Rigidbody2D objects, `legAnchor1` and `legAnchor2`, anchor the feet. There are 11 hinges: nine body/limb/head connections plus two foot pins.

Every dynamic body has manual mass **1**, linear drag **0**, angular drag **0.05**, gravity scale **1**, constraints **0**, interpolation **0**, discrete collision detection **0**, sleeping mode **1**. All hinges have motors **off**, angle limits **off**, infinite break force/torque. Stored 0…359° limits and motor strength 10000 do not affect motion while disabled.

The body transform has uniform scale **0.75**. Dimensions below are collider-local values before parent scale. Child colliders are offset from joint-origin transforms; do not interpret their transform origins as centers of mass.

| Collider | Size x × y | Offset x, y |
|---|---|---|
| Body box | 1.67333 × 2.25 | 0, −0.04 |
| Upper arm capsule | 0.88 × 1.79333 | 0, −0.538 |
| Forearm capsule | 0.59333 × 2.23333 | ~0, −0.82633 |
| Thigh capsule | 0.85333 × 1.72 | 0, −0.46890 |
| Lower leg capsule | 0.63 × 2.35333 | 0, −0.89427 |
| Static anchor box | 1.05 × 1.05 | 0, 0 |

Representative hinge coordinates, in the named connected body's local space:

| Connection | Original anchor |
|---|---|
| Left shoulder on Body | −0.75, +0.57 |
| Right shoulder on Body | +0.75, +0.57 |
| Left hip on Body | −0.43, −1.05 |
| Right hip on Body | +0.39, −1.05 |
| Elbows on Hand_U | ~0, −1.12 |
| Knees on Leg_U | ~0, −1.25 |
| Head on Body | 0, +1.20 |
| Left foot on L_Leg_D | −0.19648, −1.92572 |
| Right foot on R_Leg_D | +0.14898, −1.92572 |
| Both pins on static anchor | 0, +0.51 |

Thighs start at opposite ±15° rotations, shins rotate oppositely by 15° locally. Arm transforms include a 90° rotation and a mirrored y scale on one side. Static anchor child positions relative to Body are (−0.95, −4.725) and (+0.8625, −4.725), with local scale 1.0625. These hierarchies make a direct copy of local coordinates inappropriate for a flat rigid-body world.

## Controls

`Assets/Scripts/rigidbodyCode.cs` gets its Rigidbody2D and applies continuous force in **Update**, not FixedUpdate. While `ismovie == 0`, it always adds `transform.right * 100`. Holding Space adds `−transform.right * 300`, so the net is **+100 released / −200 held**, along the **rotating local torso axis**. Touch Began and Stationary apply the opposite force; Moved does not. The scene stores `ismovie = 1`, so that code is initially gated by the intro.

Alternative scripts are experiments rather than identical controls: `rigidbodyCodeAlternative.cs` adds +150 continuously and −300 on Space, net −150 held; stationary touch adds −350 instead. `NewControlSystem.cs` toggles direction on key down and applies 150 only while held. `introDance.cs` includes ±1500 force calls for the opening sequence.

Because force accumulation occurred in rendered Update calls, original force numbers are not guaranteed to produce identical acceleration at a different rendering/fixed-step relationship. The browser implementation consistently applies forces per solver step.

## Used as a starting point

Kept upward gravity +5, free hinges, equal default segment masses, two planted feet, and a preset with the original local-force asymmetry and damping. Approximate world-space torso dimensions are 1.25 × 1.69, derived from the original collider times 0.75. The rig now includes the separate head: a circle of radius 1.068333 × 0.75, with its center 0.854667 × 0.75 above the neck hinge. Its default mass is 1. The neck is free. A checkbox removes the head for comparison.

Changes are deliberate: simpler centered capsules, thinner debug limbs, optional self-collision (enabled by default; connected pairs excluded), floor collision, symmetric world-horizontal default control, modest default damping, render interpolation, and ≥240 Hz solver substeps. No position/rotation assignments steer the dancer. Reset explicitly reconstructs it. A zero-speed friction motor is available only as a tuning option and defaults to zero.

The web preset is called **Unity-inspired**, not an exact reproduction. The original allowed non-adjacent self-collisions, now also enabled by default in the web rig. Head and self-collision toggles can recreate the first web prototype for comparison. The first goal is a stable, expressive rig that can be tuned quickly by playing.

## Distal limb restoration

Forearms and shins now use the original collider dimensions and joint-to-center offsets, scaled by 0.75. Forearm capsule: 0.445 × 1.675 m, center 0.61975 m beyond elbow. Shin capsule: 0.4725 × 1.765 m, center 0.67070 m below knee. Knee-to-foot vertical distance: 1.44429 m; foot x offsets: left −0.14736 m, right +0.11173 m. The original sprite pivots (.87 forearm, .88 shin) and pixel scale are restored in presentation. The simplified proximal limbs remain; this is not a full Unity rig conversion. Initial shins are upright and the upper assembly is raised to keep the floor anchors planted.
