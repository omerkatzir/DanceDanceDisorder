import { presets, type Settings } from './settings';
export class DebugPanel {
  private refreshers: (() => void)[] = [];
  constructor(private s: Settings, onChange: () => void, onReset: () => void, onPause: () => void) {
    const root = document.querySelector<HTMLElement>('#tuning')!;
    const presetRoot = document.querySelector('#presets')!;
    const changed = () => {
      presetRoot.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      this.refreshers.forEach(refresh => refresh());
      onChange();
    };
    for (const [name, values] of Object.entries(presets)) {
      const b = document.createElement('button'); b.textContent = name;
      b.classList.toggle('active', name === 'Wiggle');
      b.onclick = () => {
        Object.assign(s, values); this.refreshers.forEach(fn => fn());
        changed(); b.classList.add('active'); onReset();
      }; presetRoot.append(b);
    }
    const range = (parent: HTMLElement, key: keyof Settings, label: string, min: number, max: number, step: number, unit = '') => {
      const row = document.createElement('label'); row.className = 'tune-row';
      const line = document.createElement('span'); line.className = 'tune-label';
      const name = document.createElement('span'); name.textContent = label;
      const value = document.createElement('output');
      const input = document.createElement('input'); input.type = 'range';
      input.id = String(key); input.min = String(min); input.max = String(max); input.step = String(step);
      const refresh = () => { input.value = String(s[key]); value.textContent = `${Number(s[key]).toFixed(step < 1 ? 2 : 0)}${unit}`; };
      input.oninput = () => { (s[key] as number) = Number(input.value); refresh(); changed(); };
      line.append(name, value); row.append(line, input); parent.append(row);
      this.refreshers.push(refresh); refresh();
    };
    const check = (parent: HTMLElement, key: keyof Settings, label: string) => {
      const row = document.createElement('label'); row.className = 'check-row';
      const input = document.createElement('input'); input.type = 'checkbox'; input.id = String(key);
      const refresh = () => { input.checked = Boolean(s[key]); if (key === 'legCollision') input.disabled = !s.selfCollision; };
      input.onchange = () => { (s[key] as boolean) = input.checked; changed(); };
      row.append(input, label); parent.append(row); this.refreshers.push(refresh); refresh();
    };
    const section = (label: string) => {
      const el = document.createElement('details'); const summary = document.createElement('summary');
      summary.textContent = label; el.append(summary); root.append(el); return el;
    };
    check(root, 'sprites', 'Original sprites');
    check(root, 'head', 'Physical head (resets pose)');
    check(root, 'selfCollision', 'Self-collisions');
    check(root, 'legCollision', 'Leg-to-leg collisions');
    const legNote = document.createElement('p');
    legNote.className = 'panel-note';
    legNote.textContent = 'Uncheck to let left and right legs cross. Changes live, without resetting the pose.';
    root.append(legNote);
    range(root, 'force', 'Horizontal force', 0, 150, 1, ' N');
    range(root, 'gravity', 'Gravity · + up / − down', -10, 12, 0.25);
    range(root, 'angularDamping', 'Angular damping', 0, 3, 0.05);
    const forces = section('Force & damping');
    range(forces, 'holdRatio', 'Held force multiplier', 0.25, 3, 0.05, '×');
    range(forces, 'linearDamping', 'Linear damping', 0, 3, 0.05);
    range(forces, 'forceHeight', 'Force point above center', -0.7, 0.7, 0.05, ' m');
    const selectRow = document.createElement('label'); selectRow.className = 'select-row'; selectRow.textContent = 'Apply force to';
    const select = document.createElement('select'); select.id = 'application';
    select.innerHTML = '<option value="torso">Torso only</option><option value="distributed">Torso 60% + arms 40%</option>';
    select.onchange = () => { s.application = select.value as Settings['application']; changed(); };
    selectRow.append(select); forces.append(selectRow); this.refreshers.push(() => { select.value = s.application; });
    check(forces, 'localForce', 'Rotate force with torso (Unity)');
    const mass = section('Mass distribution');
    range(mass, 'headMass', 'Head mass', 0.25, 4, 0.05, ' kg');
    range(mass, 'torsoMass', 'Torso mass', 0.25, 4, 0.05, ' kg');
    range(mass, 'armMass', 'Each arm segment', 0.25, 3, 0.05, ' kg');
    range(mass, 'legMass', 'Each leg segment', 0.25, 3, 0.05, ' kg');
    const joints = section('Joints & solver');
    check(joints, 'limits', 'Enable joint limits');
    range(joints, 'armLimit', 'Arms · ± rest angle', 30, 175, 1, '°');
    range(joints, 'legLimit', 'Legs / feet · ± rest angle', 15, 175, 1, '°');
    range(joints, 'jointFriction', 'Joint friction torque', 0, 5, 0.1, ' Nm');
    range(joints, 'hz', 'Fixed tick rate', 50, 150, 10, ' Hz');
    range(joints, 'velocityIterations', 'Velocity iterations', 4, 20, 1);
    range(joints, 'positionIterations', 'Position iterations', 3, 12, 1);
    const view = section('Debug overlays');
    check(view, 'colliders', 'Actual fixture outlines');
    check(view, 'centers', 'Body centers');
    check(view, 'anchors', 'Joint anchors');
    check(view, 'constraints', 'Constraint connections');
    document.querySelector<HTMLButtonElement>('#reset')!.onclick = onReset;
    document.querySelector<HTMLButtonElement>('#pause')!.onclick = onPause;
  }
  update(fps: number, held: boolean, angle: number, error: number, steps: number, s: Settings, paused: boolean, dropped: number) {
    document.querySelector('#rig-count')!.textContent = `${s.head ? 10 : 9} bodies · ${s.head ? 11 : 10} hinges · 1 button`;
    document.querySelector('#fps')!.textContent = `${Math.round(fps)} FPS`;
    document.querySelector('#input-state')!.innerHTML = paused ? 'PAUSED' : held ? 'HELD <b>←</b>' : 'RELEASED <b>→</b>';
    document.body.classList.toggle('held', held);
    document.querySelector('#telemetry')!.textContent = `${s.hz} Hz · ${Math.ceil(240 / s.hz)} substeps · ${steps} ticks  /  Torso ${Math.round(angle * 180 / Math.PI)}°  /  Joint error ${(error * 1000).toFixed(1)} mm  /  Dropped ${dropped.toFixed(2)} s`;
  }
}
