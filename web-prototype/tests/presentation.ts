import assert from 'node:assert/strict';
import { FaceState } from '../src/face';
import { OneButtonInput } from '../src/input';

const face = new FaceState();
assert.equal(face.expression, 2);
for (const [random, expected] of [[0, 2], [0.34, 3], [0.999, 4]]) {
  face.press(() => random); assert.equal(face.expression, expected);
}
face.reset(); assert.equal(face.expression, 2);

// Exercise real event handlers, including a quick tap between rendered frames.
class Surface extends EventTarget {
  closest() { return null; }
  focus() {}
  setPointerCapture() {}
}
const win = new EventTarget(), doc = new EventTarget(), surface = new Surface();
Object.assign(globalThis, { window: win, document: doc, HTMLElement: Surface });
let presses = 0;
const input = new OneButtonInput(surface as unknown as HTMLElement, () => presses++);
function send(target: EventTarget, type: string, values: object = {}) {
  target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), values));
}
send(win, 'keydown', { code: 'Space', repeat: false });
send(win, 'keydown', { code: 'Space', repeat: true });
assert.equal(presses, 1); assert(input.held);
send(surface, 'pointerdown', { button: 0, pointerId: 1 });
assert.equal(presses, 1); // Mixed input is still one continuous hold.
send(win, 'keyup', { code: 'Space' }); assert(input.held);
send(surface, 'pointerup', { pointerId: 1 }); assert(!input.held);
send(surface, 'pointerdown', { button: 0, pointerId: 2 });
send(surface, 'pointerup', { pointerId: 2 });
assert.equal(presses, 2); assert(!input.held);
send(surface, 'pointerdown', { button: 2, pointerId: 3 }); assert.equal(presses, 2);
send(win, 'keydown', { code: 'Space', repeat: false });
send(win, 'blur'); assert(!input.held);
const before = presses;
input.destroy();
send(win, 'keydown', { code: 'Space', repeat: false }); assert.equal(presses, before);
console.log('PASS: face selection/reset, press edge, repeat suppression, mixed input, quick tap, blur, cleanup.');
