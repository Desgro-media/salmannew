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
