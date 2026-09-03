import { World, Vec2 } from 'planck';
import { Dancer, pose } from './dancer';
import type { Settings } from './settings';

export class Physics {
  world!: World;
  dancer!: Dancer;
  accumulator = 0;
  steps = 0;
  droppedTime = 0;
  constructor(public settings: Settings) { this.reset(); }
  reset() {
    this.world = new World(Vec2(0, this.settings.gravity));
    this.dancer = new Dancer(this.world, this.settings);
    this.accumulator = 0;
    this.steps = 0;
    this.droppedTime = 0;
  }
  tune() {
    if (this.settings.head !== this.dancer.parts.some(p => p.group === 'head')) {
      this.reset();
      return;
    }
    this.world.setGravity(Vec2(0, this.settings.gravity));
    this.dancer.tune(this.settings);
    this.accumulator = 0;
    for (const p of this.dancer.parts) p.previous = pose(p.body);
  }
  advance(seconds: number, held: boolean) {
    const dt = 1 / this.settings.hz;
    const elapsed = Math.min(Math.max(0, seconds), 0.1);
    this.droppedTime += Math.max(0, seconds - elapsed);
    this.accumulator += elapsed;
    let count = 0;
    while (this.accumulator + 1e-10 >= dt && count < 16) {
      for (const p of this.dancer.parts) p.previous = pose(p.body);
      // Keep long fixed ticks safe under the original's very strong forces.
      // Controls are sampled once per tick; forces are re-applied each substep.
      const substeps = Math.ceil(dt * 240);
      for (let i = 0; i < substeps; i++) {
        this.dancer.applyControl(held, this.settings);
        this.world.step(dt / substeps, this.settings.velocityIterations, this.settings.positionIterations);
      }
      this.accumulator = Math.max(0, this.accumulator - dt);
      this.steps++;
      count++;
    }
    return Math.min(1, this.accumulator / dt);
  }
}
