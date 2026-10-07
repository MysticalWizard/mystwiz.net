// One requestAnimationFrame loop for everything that moves every frame: parallax, speed lines,
// the hero train. Callbacks get the frame time and the time since the last frame (capped).
type FrameCallback = (now: number, dt: number) => void;

const callbacks = new Set<FrameCallback>();
let raf = 0;
let last = 0;

function loop(now: number) {
  const dt = last ? Math.min(50, now - last) : 16;
  last = now;
  for (const callback of callbacks) callback(now, dt);
  if (callbacks.size) {
    raf = requestAnimationFrame(loop);
  } else {
    raf = 0;
    last = 0;
  }
}

/** Runs the callback every frame until the returned function is called. */
export function onFrame(callback: FrameCallback): () => void {
  callbacks.add(callback);
  raf ||= requestAnimationFrame(loop);
  return () => callbacks.delete(callback);
}
