// The original controller starts at Head_2_blue (color=4). A press picks
// color 4, 5 or 6, i.e. expressions 2, 3 or 4. Repeats are intentional.
export class FaceState {
  expression = 2;
  press(random = Math.random) { this.expression = 2 + Math.floor(random() * 3); }
  reset() { this.expression = 2; }
}

