import Phaser from 'phaser';
import { CircleShape, PolygonShape, Vec2 } from 'planck';
import { Physics } from './physics';
import { OneButtonInput } from './input';
import { DebugPanel } from './debug';
import { defaults } from './settings';
import './style.css';

class DanceLab extends Phaser.Scene {
  physicsRig = new Physics({ ...defaults });
  controls!: OneButtonInput;
  panel!: DebugPanel;
  graphics!: Phaser.GameObjects.Graphics;
  paused = false;
  lastDebug = 0;
  create() {
    this.graphics = this.add.graphics();
    this.controls = new OneButtonInput(document.querySelector('#game')!);
    this.panel = new DebugPanel(this.physicsRig.settings, () => this.physicsRig.tune(),
      () => { this.controls.clear(); this.physicsRig.reset(); }, () => {
        this.paused = !this.paused; this.controls.clear();
        document.querySelector('#pause')!.textContent = this.paused ? 'Resume' : 'Pause';
      });
    this.events.once('shutdown', () => this.controls.destroy());
  }
  update(time: number, delta: number) {
    if (!this.graphics) return;
    const rig = this.physicsRig;
    const alpha = this.paused ? 1 : rig.advance(delta / 1000, this.controls.held);
    this.draw(alpha);
    if (time - this.lastDebug > 100) {
      this.panel.update(this.game.loop.actualFps, this.controls.held, rig.dancer.torso.body.getAngle(),
        rig.dancer.maxAnchorError(), rig.steps, rig.settings, this.paused, rig.droppedTime);
      this.lastDebug = time;
    }
  }
  draw(alpha: number) {
    const g = this.graphics;
    const { dancer, settings: s } = this.physicsRig;
    const w = this.scale.width, h = this.scale.height;
    // One world-space scale, independent of device size and physics timestep.
    const scale = Math.min(w / 10.8, (h - 60) / 7.3);
    const ox = w / 2, oy = h - 40;
    const point = (v: { x: number; y: number }) => ({ x: ox + v.x * scale, y: oy - v.y * scale });
    g.clear();
    g.lineStyle(1, 0x34433a, 0.38);
    for (let x = ox % scale; x < w; x += scale) g.lineBetween(x, 0, x, h);
    for (let y = oy % scale; y < h; y += scale) g.lineBetween(0, y, w, y);
    g.fillStyle(0x242f29); g.fillRect(0, oy, w, h - oy);
    g.lineStyle(2, 0x52684e); g.lineBetween(0, oy, w, oy);
    for (const side of [-1, 1]) {
      const p = point({ x: side * 0.68, y: 0.18 });
      g.fillStyle(0x798771); g.fillRoundedRect(p.x - scale * 0.27, p.y, scale * 0.54, oy - p.y + 5, 3);
    }
    for (const p of dancer.parts) {
      const current = p.body.getPosition();
      const x = p.previous.x + (current.x - p.previous.x) * alpha;
      const y = p.previous.y + (current.y - p.previous.y) * alpha;
      const angle = p.previous.angle + (p.body.getAngle() - p.previous.angle) * alpha;
      const pos = point({ x, y });
      g.save(); g.translateCanvas(pos.x, pos.y); g.rotateCanvas(-angle);
      const width = p.width * scale, height = p.height * scale;
      g.fillStyle(p.color, 0.92); g.fillRoundedRect(-width / 2, -height / 2, width, height, width / 2);
      g.lineStyle(1.5, 0xffffff, 0.22); g.strokeRoundedRect(-width / 2, -height / 2, width, height, width / 2);
      // A simple orientation stripe, not sprite animation or final artwork.
      if (p.group === 'torso') {
        g.lineStyle(2, 0x324527, 0.6); g.lineBetween(-width * 0.25, -height * 0.22, width * 0.25, -height * 0.22);
      }
      g.restore();
      if (s.colliders) {
        g.lineStyle(1, 0xf5fff5, 0.9);
        for (let f = p.body.getFixtureList(); f; f = f.getNext()) {
          const shape = f.getShape();
          if (shape.getType() === 'circle') {
            const c = shape as CircleShape; const center = point(p.body.getWorldPoint(c.getCenter()));
            g.strokeCircle(center.x, center.y, c.getRadius() * scale);
          } else if (shape.getType() === 'polygon') {
            const vertices = (shape as PolygonShape).m_vertices.map(v => point(p.body.getWorldPoint(v)));
            g.strokePoints(vertices, true);
          }
        }
      }
      if (s.centers) {
        const center = point(p.body.getWorldCenter());
        g.lineStyle(1.5, 0xffffff); g.lineBetween(center.x - 5, center.y, center.x + 5, center.y);
        g.lineBetween(center.x, center.y - 5, center.x, center.y + 5);
      }
    }
    for (const { joint } of dancer.hinges) {
      const a = point(joint.getAnchorA()), b = point(joint.getAnchorB());
      if (s.constraints) {
        const c = point(joint.getBodyA().getWorldCenter()), d = point(joint.getBodyB().getWorldCenter());
        g.lineStyle(1, 0x72d8ed, 0.7); g.lineBetween(c.x, c.y, a.x, a.y); g.lineBetween(b.x, b.y, d.x, d.y);
      }
      if (s.anchors) {
        g.fillStyle(0x172019); g.fillCircle(a.x, a.y, 4);
        g.lineStyle(1.5, 0xe4f0d5); g.strokeCircle(a.x, a.y, 4);
        if (Vec2.distance(joint.getAnchorA(), joint.getAnchorB()) > 0.01) {
          g.lineStyle(2, 0xff7065); g.lineBetween(a.x, a.y, b.x, b.y);
        }
      }
    }
    const force = dancer.lastForce;
    const length = Math.hypot(force.x, force.y);
    if (length > 0.01) {
      const a = point(dancer.lastApplication);
      const dx = force.x / length, dy = -force.y / length;
      const size = Math.min(80, 18 + length * 0.4);
      const bx = a.x + dx * size, by = a.y + dy * size;
      g.lineStyle(2, this.controls.held ? 0xb5a0ff : 0xe4ff96);
      g.lineBetween(a.x, a.y, bx, by);
      g.lineBetween(bx, by, bx - dx * 8 + dy * 5, by - dy * 8 - dx * 5);
      g.lineBetween(bx, by, bx - dx * 8 - dy * 5, by - dy * 8 + dx * 5);
    }
  }
}

new Phaser.Game({ type: Phaser.AUTO, parent: 'game', backgroundColor: '#1b2222',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: DanceLab, antialias: true, banner: false,
  input: { keyboard: false, mouse: false, touch: false },
});
