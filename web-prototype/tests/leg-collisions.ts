import assert from 'node:assert/strict';
import { Physics } from '../src/physics';
import { defaults, presets } from '../src/settings';
const p = new Physics({ ...defaults, ...presets['Loose noodle'] });
// Reproduce the photographed ~29-degree wedge.
for (let i = 0; i < 6000; i++) p.advance(1 / 120, Math.floor(i / 1200) % 2 === 1);
const torso = p.dancer.torso.body;
const before = { ...torso.getPosition() };
assert(before.x > 0.8 && before.x < 1.1);
for (let i = 0; i < 240; i++) p.advance(1 / 120, false);
assert(Math.abs(torso.getPosition().x - before.x) < 0.01, 'Baseline remains wedged');
const pose = { ...torso.getPosition() };
p.settings.legCollision = false; p.tune();
assert.equal(p.dancer.torso.body, torso, 'Toggle must not reset rig');
assert.deepEqual({ ...torso.getPosition() }, pose, 'Toggle must not move bodies');
for (const part of p.dancer.parts) {
  const f = part.body.getFixtureList()!;
  assert(f.getFilterMaskBits() & 1, 'All parts retain floor/upper-body collision category');
  if (part.group === 'leg') {
    const otherLeg = part.name.startsWith('L ') ? 4 : 2;
    assert.equal(f.getFilterMaskBits() & otherLeg, 0);
  } else assert.equal(f.getFilterMaskBits(), 0xffff);
}
for (let i = 0; i < 600; i++) p.advance(1 / 120, false);
assert(torso.getPosition().x > 1.5, 'Same-direction pull should escape leg wedge');
p.settings.legCollision = true; p.tune();
for (const part of p.dancer.parts) assert.equal(part.body.getFixtureList()!.getFilterMaskBits(), 0xffff);
for (let i = 0; i < 1200; i++) {
  p.advance(1 / 120, Math.floor(i / 60) % 2 === 0);
  assert(p.dancer.maxAnchorError() < 0.09);
  for (const part of p.dancer.parts) assert(Number.isFinite(part.body.getPosition().x));
}
console.log('PASS: reproduces wedge, live toggle releases it, other collisions preserved, re-enable stable.');
