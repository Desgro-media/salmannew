// The surface a bottle stands on in the shop grid, the homepage rows and the
// related-products row.
//
// The card art is a background-removed cutout, and a cutout dropped on flat
// white reads as exactly that — a PNG with its background deleted — because
// every cue that says "photographed" is missing. These layers put those cues
// back: a lit sweep behind the bottle, a warm floor for it to stand on, a
// bounce of the product's own colour rising off that floor, and a pool of
// contact shadow under it so it is sitting on the surface rather than floating
// in front of it.
//
// Gradients rather than blurred elements on purpose. This repeats for every
// card in the grid, and a filter layer per card is a re-raster on every scroll
// frame — the same reason the chips here dropped backdrop-blur.
//
// `accent` is the product's own colour, and arrives as a 6-digit hex, so the
// two-digit suffixes below are alpha (`00` fully transparent).
// The glow behind the bottle in the dark homepage spotlight: the product's own
// colour as a soft halo, like a coloured light placed behind it.
//
// A glow in the accent colour only shows if the accent is brighter than the
// section it sits on, and plenty of accents are not (Privé Black, Orchid, deep
// blue, oud brown are all close to the near-black section). So a dark accent is
// mixed toward white until it is bright enough to read as light, which keeps
// its hue — blue stays bluish, brown stays warm — instead of switching every
// dark product to the same grey. Bright accents are used as they are.
//
// Gradients only, no blurred element, so it costs nothing to repaint while the
// spotlight rotates.
export function spotlightGlow(accent: string): string {
  const hex = /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#ffffff";
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];

  // perceived brightness, 0–255
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const TARGET = 120;
  const t = luma >= TARGET ? 0 : (TARGET - luma) / (255 - luma);
  const lift = (channel: number) => Math.round(channel + (255 - channel) * t);
  const c = `#${[lift(r), lift(g), lift(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

  return [
    // the halo, close behind the bottle
    `radial-gradient(54% 44% at 50% 52%, ${c}5c 0%, ${c}29 46%, ${c}00 78%)`,
    // a wider, fainter wash so the light falls off gradually
    `radial-gradient(88% 72% at 50% 55%, ${c}1f 0%, ${c}00 72%)`,
  ].join(",");
}

export function wellSurface(accent: string): string {
  return [
    // contact shadow, pooled under the bottle rather than a hard ellipse —
    // wide and shallow so it works for a tall flacon and a squat one alike
    "radial-gradient(30% 7% at 50% 84%, rgba(19,17,16,0.20) 0%, rgba(19,17,16,0) 72%)",
    // the product's colour bouncing off the floor
    `radial-gradient(72% 38% at 50% 100%, ${accent}2e 0%, ${accent}00 72%)`,
    // key light, high and centred, blowing the sweep to white behind the cap
    "radial-gradient(70% 50% at 50% 16%, #ffffff 0%, rgba(255,255,255,0) 72%)",
    // the sweep itself: white at the top, easing into a floor a couple of steps
    // below the white page the card now sits on. The floor used to be cream, to
    // agree with a cream ground; left that warm against white it reads as a
    // yellow smudge under the bottle rather than as shadow.
    "linear-gradient(180deg, #ffffff 0%, #fbfaf8 48%, #eeece7 100%)",
  ].join(",");
}
