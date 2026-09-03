export class OneButtonInput {
  private space = false;
  private pointers = new Set<number>();
  private cleanup = new AbortController();
  get held() { return this.space || this.pointers.size > 0; }
  clear = () => { this.space = false; this.pointers.clear(); };
  constructor(surface: HTMLElement) {
    const signal = this.cleanup.signal;
    const editing = (target: EventTarget | null) => target instanceof HTMLElement &&
      !!target.closest('input, select, textarea, button, summary, [contenteditable="true"]');
    window.addEventListener('keydown', event => {
      if (event.code === 'Space' && !editing(event.target)) {
        event.preventDefault(); this.space = true;
      }
    }, { signal });
    window.addEventListener('keyup', event => {
      if (event.code === 'Space') { this.space = false; }
    }, { signal });
    surface.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      surface.focus({ preventScroll: true });
      surface.setPointerCapture(event.pointerId);
      this.pointers.add(event.pointerId);
      event.preventDefault();
    }, { signal });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      surface.addEventListener(type, event => this.pointers.delete((event as PointerEvent).pointerId), { signal });
    }
    window.addEventListener('blur', this.clear, { signal });
    document.addEventListener('visibilitychange', this.clear, { signal });
  }
  destroy() { this.cleanup.abort(); this.clear(); }
}
