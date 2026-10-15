/** Hidden SVG <symbol> for the 8-point star, reused via <use href="#star8">. Render once per page. */
export function StarSymbol() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="star8" viewBox="0 0 100 100">
          <g fill="currentColor"><rect x="22" y="22" width="56" height="56" /><rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" /></g>
        </symbol>
      </defs>
    </svg>
  );
}
