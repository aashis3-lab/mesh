// The card's woven gold wire as a tiling SVG: horizontal and vertical strands crossing
// over and under in a checkerboard, rotated 45°. Under-strands break at each crossing.
const S = 22; // strand spacing
const G = 3; // gap either side of an over-strand

const a = S / 2;
const b = (3 * S) / 2;
const T = 2 * S;

const segments = [
  // Horizontal strands, broken where the vertical one passes over.
  [0, a, b - G, a], [b + G, a, T, a],
  [0, b, a - G, b], [a + G, b, T, b],
  // Vertical strands, broken where the horizontal one passes over.
  [a, 0, a, a - G], [a, a + G, a, T],
  [b, 0, b, b - G], [b, b + G, b, T],
];

export function WovenLattice({ className = "" }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="weave" width={T} height={T} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          {segments.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9A24D" strokeWidth="0.9" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#weave)" />
    </svg>
  );
}
