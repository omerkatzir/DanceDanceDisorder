import { World, Vec2, Box, Circle, RevoluteJoint, type Body } from 'planck';
import type { Settings } from './settings';
import { unityLimbs } from './unity-limbs';

export interface Pose { x: number; y: number; angle: number }
export interface Part { name: string; body: Body; width: number; height: number;
  group: 'torso' | 'arm' | 'leg' | 'head'; color: number; previous: Pose }
export interface Hinge { joint: RevoluteJoint; kind: 'arm' | 'leg' | 'foot' | 'neck' }
export const pose = (b: Body): Pose => ({ ...b.getPosition(), angle: b.getAngle() });

// The rig owns Planck bodies. Rendering only consumes poses and dimensions.
export class Dancer {
  parts: Part[] = [];
  hinges: Hinge[] = [];
  torso: Part;
  lastForce = { x: 0, y: 0 };
  lastApplication = { x: 0, y: 0 };

  constructor(public world: World, settings: Settings) {
    const ground = world.createBody();
    ground.createFixture(Box(20, 0.15, Vec2(0, -0.15)), { friction: 0.4 });
    const shinSpec = unityLimbs.shin;
    const kneeY = 0.18 + shinSpec.footFromKneeY;
    const lift = kneeY - 1.46;
    this.torso = this.part('Torso', 'torso', 0, 3.15 + lift, 1.25, 1.69, 0, 0xc9f36b);
    for (const side of [-1, 1]) {
      const prefix = side < 0 ? 'L' : 'R';
      const color = side < 0 ? 0xa897ff : 0xff9d77;
      const foot = Vec2(side * 0.68, 0.18);
      const footOffsetX = side < 0 ? shinSpec.leftFootFromKneeX : shinSpec.rightFootFromKneeX;
      const knee = Vec2(foot.x - footOffsetX, kneeY);
      const hip = Vec2(side * 0.30, 2.40 + lift);
      const thigh = this.segment(`${prefix} thigh`, 'leg', hip, knee, 0.36, color);
      const shin = this.part(`${prefix} shin`, 'leg', knee.x, knee.y - shinSpec.centerFromKnee,
        shinSpec.width, shinSpec.height, -Math.PI, color);
      this.hinge(this.torso.body, thigh.body, hip, 'leg');
      this.hinge(thigh.body, shin.body, knee, 'leg');
      this.hinge(ground, shin.body, foot, 'foot');
      const shoulder = Vec2(side * 0.59, 3.60 + lift);
      const elbow = Vec2(side * 1.43, 3.91 + lift);
      const hand = Vec2(side * 2.50, 4.02 + lift);
      const upper = this.segment(`${prefix} upper arm`, 'arm', shoulder, elbow, 0.32, color);
      const direction = Vec2.sub(hand, elbow);
      direction.normalize();
      const arm = unityLimbs.forearm;
      const lower = this.part(`${prefix} forearm`, 'arm',
        elbow.x + direction.x * arm.centerFromElbow,
        elbow.y + direction.y * arm.centerFromElbow,
        arm.width, arm.height, Math.atan2(direction.y, direction.x) - Math.PI / 2, color);
      this.hinge(this.torso.body, upper.body, shoulder, 'arm');
      this.hinge(upper.body, lower.body, elbow, 'arm');
    }
    if (settings.head) {
      // Unity local radius/offset/neck anchor, scaled by the original torso's .75.
      const radius = 1.068333387 * 0.75;
      const neck = Vec2(0, 3.15 + lift + 1.2 * 0.75);
      const head = this.part('Head', 'head', 0, neck.y + 0.85466671 * 0.75,
        radius * 2, radius * 2, 0, 0xc9f36b);
      this.hinge(this.torso.body, head.body, neck, 'neck');
    }
    this.tune(settings);
  }

  private part(name: string, group: Part['group'], x: number, y: number,
    width: number, height: number, angle: number, color: number): Part {
    const body = this.world.createDynamicBody({ position: Vec2(x, y), angle, allowSleep: false });
    // Capsule: central box plus two circular caps. Inner cap halves overlap
    // the box; tune() normalizes total mass, preserving compound inertia.
    const radius = width / 2;
    const stem = height / 2 - radius;
    const fixture = { density: 1, friction: 0.25, restitution: 0.05, filterGroupIndex: -1 };
    if (stem <= 0) body.createFixture(Circle(radius), fixture);
    else {
      body.createFixture(Box(radius, stem), fixture);
      body.createFixture(Circle(Vec2(0, stem), radius), fixture);
      body.createFixture(Circle(Vec2(0, -stem), radius), fixture);
    }
    const part: Part = { name, body, width, height, group, color, previous: pose(body) };
    this.parts.push(part);
    return part;
  }

  private segment(name: string, group: Part['group'], a: Vec2, b: Vec2, width: number, color: number) {
    const length = Vec2.distance(a, b);
    return this.part(name, group, (a.x + b.x) / 2, (a.y + b.y) / 2,
      width, length + width, Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2, color);
  }

  private hinge(a: Body, b: Body, anchor: Vec2, kind: Hinge['kind']) {
    const joint = new RevoluteJoint({ collideConnected: false }, a, b, anchor);
    this.world.createJoint(joint);
    this.hinges.push({ joint, kind });
  }

  tune(s: Settings) {
    for (const p of this.parts) {
      const mass = p.group === 'head' ? s.headMass : p.group === 'torso' ? s.torsoMass : p.group === 'arm' ? s.armMass : s.legMass;
      const ratio = mass / p.body.getMass();
      for (let f = p.body.getFixtureList(); f; f = f.getNext()) {
        f.setDensity(f.getDensity() * ratio);
        // Distinct leg categories let opposite legs overlap while retaining
        // their contacts with torso, arms, head and floor. Refilter live.
        const category = p.group === 'leg' ? (p.name.startsWith('L ') ? 2 : 4) : 1;
        const opposite = category === 2 ? 4 : category === 4 ? 2 : 0;
        const group = s.selfCollision ? 0 : -1;
        const mask = s.legCollision ? 0xffff : 0xffff & ~opposite;
        if (f.getFilterGroupIndex() !== group || f.getFilterCategoryBits() !== category || f.getFilterMaskBits() !== mask) {
          f.setFilterData({ groupIndex: group, categoryBits: category, maskBits: mask });
        }
      }
      p.body.resetMassData();
      p.body.setLinearDamping(s.linearDamping);
      p.body.setAngularDamping(s.angularDamping);
      p.body.setAwake(true);
    }
    for (const { joint, kind } of this.hinges) {
      const limit = (kind === 'arm' ? s.armLimit : s.legLimit) * Math.PI / 180;
      joint.enableLimit(s.limits && kind !== 'neck');
      joint.setLimits(-limit, limit);
      // A zero-speed torque-limited motor supplies tunable joint friction,
      // not a pose controller. Zero leaves the hinge completely free.
      joint.enableMotor(s.jointFriction > 0);
      joint.setMotorSpeed(0);
      joint.setMaxMotorTorque(s.jointFriction);
    }
  }

  applyControl(held: boolean, s: Settings) {
    const magnitude = s.force * (held ? -s.holdRatio : 1);
    const angle = s.localForce ? this.torso.body.getAngle() : 0;
    this.lastForce = { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
    const point = this.torso.body.getWorldPoint(Vec2(0, s.forceHeight));
    this.lastApplication = { ...point };
    const share = s.application === 'distributed' ? 0.6 : 1;
    this.torso.body.applyForce(Vec2(this.lastForce.x * share, this.lastForce.y * share), point, true);
    if (s.application === 'distributed') {
      for (const p of this.parts.filter(p => p.group === 'arm')) {
        p.body.applyForceToCenter(Vec2(this.lastForce.x * 0.1, this.lastForce.y * 0.1), true);
      }
    }
  }

  maxAnchorError() {
    return Math.max(...this.hinges.map(({ joint }) => Vec2.distance(joint.getAnchorA(), joint.getAnchorB())));
  }
}
