import assert from 'node:assert/strict';
import { Physics } from '../src/physics';
import { defaults, presets, type Settings } from '../src/settings';

function simulate(name: string, settings: Settings, seconds = 90) {
  const p = new Physics(settings);
  let error = 0, minX = Infinity, maxX = -Infinity, peakSpeed = 0;
  for (let i = 0; i < seconds * 60; i++) {
    // Long holds, rapid alternation, then irregular pulses.
    const t = i / 60;
    const held = t < 20 ? false : t < 40 ? true : t < 60 ? Math.floor(t * 3) % 2 === 0 : Math.sin(t * 4) > 0.2;
    p.advance(1 / 60, held);
    for (const part of p.dancer.parts) {
      const pos = part.body.getPosition();
      assert(Number.isFinite(pos.x + pos.y + part.body.getAngle()), `${name}: non-finite body`);
      assert(Math.abs(pos.x) < 12 && Math.abs(pos.y) < 12, `${name}: rig escaped`);
      peakSpeed = Math.max(peakSpeed, part.body.getLinearVelocity().length());
    }
    error = Math.max(error, p.dancer.maxAnchorError());
    const x = p.dancer.torso.body.getPosition().x;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  }
  assert(error < 0.09, `${name}: joint drift ${error}`);
  assert(maxX - minX > 0.5, `${name}: insufficient response`);
  assert.equal(p.dancer.parts.length, settings.head ? 10 : 9);
  assert.equal(p.dancer.hinges.length, settings.head ? 11 : 10);
  console.log(`${name}: ${seconds}s, sweep ${(maxX-minX).toFixed(2)}m, max joint error ${(error*1000).toFixed(2)}mm, peak speed ${peakSpeed.toFixed(1)}m/s`);
}

for (const [name, preset] of Object.entries(presets)) simulate(name, { ...defaults, ...preset });
simulate('Heavy torso + limits', { ...defaults, torsoMass: 4, armMass: 0.25, legMass: 0.5, limits: true, jointFriction: 1.5 });
simulate('Downward gravity', { ...defaults, gravity: -10, force: 100, application: 'distributed' });
simulate('High force / low solver', { ...defaults, force: 150, holdRatio: 3, hz: 50, velocityIterations: 4, positionIterations: 3 });

simulate('Head, no self-collision', { ...defaults, selfCollision: false });
simulate('No head, self-collision', { ...defaults, head: false });
simulate('Original web rig', { ...defaults, head: false, selfCollision: false });

// Identical input boundaries at multiple rendering rates must produce the same physical result.
function atRate(fps: number) {
  const p = new Physics({ ...defaults });
  for (let i = 0; i < fps * 8; i++) p.advance(1 / fps, Math.floor(i / fps) % 2 === 0);
  return p;
}
const a = atRate(30), b = atRate(60), c = atRate(144);
assert.equal(a.steps, b.steps); assert.equal(b.steps, c.steps);
for (let i = 0; i < a.dancer.parts.length; i++) {
  assert(Math.abs(a.dancer.parts[i].body.getPosition().x - c.dancer.parts[i].body.getPosition().x) < 1e-8);
}
const edited = new Physics({ ...defaults });
edited.settings.torsoMass = 3; edited.settings.armMass = 0.4; edited.settings.gravity = -5; edited.tune();
assert(Math.abs(edited.dancer.torso.body.getMass() - 3) < 1e-8);
assert.equal(edited.world.getGravity().y, -5);
edited.advance(5, true); assert(edited.steps <= 16); assert(edited.droppedTime > 4);
edited.reset(); assert.equal(edited.steps, 0); assert(edited.dancer.maxAnchorError() < 1e-8);
console.log('PASS: render-rate independence, runtime tuning, long-frame cap, reset.');

const toggle = new Physics({ ...defaults });
const oldTorso = toggle.dancer.torso.body;
toggle.settings.selfCollision = false; toggle.tune();
assert.equal(toggle.dancer.torso.body, oldTorso, 'Collision toggle preserves pose/world');
for (const part of toggle.dancer.parts) {
  for (let f = part.body.getFixtureList(); f; f = f.getNext()) assert.equal(f.getFilterGroupIndex(), -1);
}
toggle.settings.selfCollision = true; toggle.tune();
for (const part of toggle.dancer.parts) {
  for (let f = part.body.getFixtureList(); f; f = f.getNext()) assert.equal(f.getFilterGroupIndex(), 0);
}
const head = toggle.dancer.parts.find(p => p.group === 'head')!;
assert(Math.abs(head.body.getMass() - 1) < 1e-8);
assert.equal(head.body.getFixtureList()!.getShape().getType(), 'circle');
assert.equal(head.body.getFixtureList()!.getNext(), null);
assert.equal(toggle.dancer.hinges.find(h => h.kind === 'neck')!.joint.isLimitEnabled(), false);
toggle.settings.head = false; toggle.tune(); assert.equal(toggle.dancer.parts.length, 9);
toggle.settings.head = true; toggle.tune(); assert.equal(toggle.dancer.parts.length, 10);
console.log('PASS: head geometry/mass, free neck, live collision filtering, head toggle.');
