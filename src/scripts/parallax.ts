// Depth. On fine pointers the home hero's planes drift with the cursor and scroll at different
// rates, the board tilts, and every other station's ghost numeral drifts behind its board.
// While someone holds to depart, the board shakes. Nothing moves under reduced motion.
import { onFrame } from './frame';
import { speed } from './speed';

const finePointer = window.matchMedia('(pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

window.addEventListener(
  'pointermove',
  (event) => {
    if (event.pointerType !== 'mouse') return;
    pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1;
  },
  { passive: true },
);

/** Offsets per plane: pointer x and y in px, and how fast it moves with scroll. */
const PLANES: Record<string, { x: number; y: number; scroll: number }> = {
  back: { x: -16, y: -10, scroll: 0.32 },
  line: { x: -9, y: -6, scroll: 0.16 },
  front: { x: 18, y: 12, scroll: -0.12 },
  ghost: { x: -14, y: -8, scroll: 0.3 },
};

const written = new WeakMap<HTMLElement, string>();

function setTransform(el: HTMLElement, transform: string) {
  if (written.get(el) === transform) return;
  written.set(el, transform);
  el.style.transform = transform;
}

onFrame(() => {
  const still = reducedMotion.matches;
  const depth = finePointer.matches && !still;
  pointer.x += (pointer.targetX - pointer.x) * 0.07;
  pointer.y += (pointer.targetY - pointer.y) * 0.07;
  const { x, y } = depth ? pointer : { x: 0, y: 0 };
  const scroll = depth ? window.scrollY : 0;
  const shake = still ? 0 : (Math.random() - 0.5) * 2.4 * speed.hold;

  for (const el of document.querySelectorAll<HTMLElement>('[data-plane]')) {
    const plane = el.dataset.plane ?? '';
    const jolt = `translate3d(${shake.toFixed(2)}px, ${(shake * 0.5).toFixed(2)}px, 0)`;
    if (plane === 'board') {
      // Home's board tilts toward the cursor.
      setTransform(
        el,
        `${jolt} rotateX(${(y * -1.6).toFixed(3)}deg) rotateY(${(x * 2.2).toFixed(3)}deg)`,
      );
      continue;
    }
    if (plane === 'shake') {
      setTransform(el, jolt);
      continue;
    }
    const offsets = PLANES[plane];
    if (!offsets) continue;
    setTransform(
      el,
      `translate3d(${(x * offsets.x).toFixed(2)}px, ${(y * offsets.y + scroll * offsets.scroll).toFixed(2)}px, 0)`,
    );
  }
});
