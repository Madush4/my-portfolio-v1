// The two scroll-driven animations (portrait turn, headphones + keyboard).
//
// Frames were exported straight from the original videos as WebP:
//   a  -> portrait turn,          75 frames (1920px desktop, 960px phone)
//   b  -> headphones + keyboard, 121 frames (1600px desktop, 960px phone)
//
// To re-export (see README), drop the new files in public/frames/<key> and
// public/frames/<key>-m, then update `count`. Nothing else needs to change.

export type SeqKey = 'a' | 'b';

type SequenceConfig = {
  dir: string;
  /** smaller copies used on phones and narrow screens */
  mobileDir: string;
  prefix: string;
  ext: string;
  /** digits in the frame number, e.g. 3 -> 001 */
  pad: number;
  count: number;
  /** horizontal crop anchor when the frame is scaled to cover the screen (0 = left, 1 = right) */
  focusX: number;
};

export const sequences: Record<SeqKey, SequenceConfig> = {
  a: { dir: '/frames/a', mobileDir: '/frames/a-m', prefix: 'f', ext: 'webp', pad: 3, count: 75, focusX: 0.24 },
  b: { dir: '/frames/b', mobileDir: '/frames/b-m', prefix: 'f', ext: 'webp', pad: 3, count: 121, focusX: 0.6 },
};

/** Phones and small tablets get the lighter frame set. */
export const useSmallFrames = () => matchMedia('(max-width: 900px), (pointer: coarse)').matches;

export const frameUrl = (key: SeqKey, i: number) => {
  const { dir, mobileDir, prefix, ext, pad } = sequences[key];
  return `${useSmallFrames() ? mobileDir : dir}/${prefix}${String(i + 1).padStart(pad, '0')}.${ext}`;
};

/**
 * Load order: a coarse pass first (every 8th frame), then fill the gaps.
 * After the coarse pass the whole animation already "works" from start to end,
 * so a visitor who scrolls fast never sees a frozen picture, only a slightly
 * less fluid one for a second while the rest streams in.
 */
export function loadOrder(count: number) {
  // The first and last frames come first: the opening pose and the resting pose.
  const order = [...new Set([0, count - 1])];
  const seen = new Set(order);
  for (const step of [8, 4, 2, 1]) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  return order;
}

/** How many frames of the load order make up the coarse pass. */
export const coarseCount = (count: number) => Math.ceil(count / 8) + 1;
