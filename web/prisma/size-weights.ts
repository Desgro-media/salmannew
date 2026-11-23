/**
 * The weight of each sealed box on the owner's shop scale, in whole grams, by SKU.
 * Read from the 26 photos in "product weights/" (2026-11-23): the scale's label says
 * kg but its digits are grams (a perfume box does not weigh 255 kg). Each reading is
 * the box with its bottle and shrink-wrap — no shipping packaging, which
 * StoreSettings.packingGrams adds once per order.
 *
 * Why it matters: India Post bills Speed Post in weight slabs (one price up to 250 g,
 * a dearer one from 251 g to 500 g, another above), and the parcel weight sent to
 * PostBridge is the sum of these times the quantities, plus packing.
 *
 * The three box types weigh almost the same inside each type, which is how the
 * estimates below were made:
 *   slim 20 ml `me.` box   101.1 – 102.2 g  (5 measured, mean 101.8)
 *   50 ml `me.` box        222.3 – 226.4 g  (9 measured, mean 224.7)
 *   Privé cylinder         201.1 – 204.2 g  (5 measured, mean 202.7)
 *
 * Applied to a database by prisma/set-weights.ts, and to a fresh dev database by
 * prisma/seed.ts. Weights entered later in the admin are the real source of truth;
 * this file is how they were first loaded, and how a new database starts.
 */

export interface SizeWeight {
  grams: number;
  /** No photo for this size: the mean of its box type, to be replaced when it is weighed. */
  estimated?: boolean;
}

export const SIZE_WEIGHTS: Record<string, SizeWeight> = {
  // me. — 20 ml (slim box)
  "SP-BLU-020": { grams: 102 }, // 102.1
  "SP-IMP-020": { grams: 102 }, // 102.2
  "SP-LOV-020": { grams: 102 }, // 101.7
  "SP-OUL-020": { grams: 102 }, // 101.9
  "SP-AKH-020": { grams: 102, estimated: true },
  "SP-LTH-020": { grams: 102, estimated: true },
  "SP-ORC-020": { grams: 102, estimated: true },
  "SP-OUD-020": { grams: 102, estimated: true },

  // me. — 50 ml
  "SP-AKH-050": { grams: 223 }, // 223.0
  "SP-BLU-050": { grams: 226 }, // 226.4
  "SP-IMP-050": { grams: 226 }, // 225.6
  "SP-KIA-050": { grams: 224 }, // 223.7
  "SP-LAT-050": { grams: 224 }, // 224.1 (photographed as "Lather")
  "SP-LOV-050": { grams: 225 }, // 225.0
  "SP-ORC-050": { grams: 222 }, // 222.3
  "SP-OUD-050": { grams: 226 }, // 226.2
  "SP-SWT-050": { grams: 226 }, // 225.9
  "SP-OUL-050": { grams: 225, estimated: true },

  // Privé — cylinders
  "SP-PVG-050": { grams: 201 }, // 201.1
  "SP-PVO-050": { grams: 202 }, // 201.7
  "SP-PVR-050": { grams: 203 }, // 203.1
  "SP-PVW-050": { grams: 204 }, // 204.2
  "SP-PVY-050": { grams: 204 }, // 203.6
  "SP-PVB-050": { grams: 203, estimated: true },

  // Photographed, but not in the catalogue this was written against, so no SKU to
  // attach them to yet. Enter them in the admin when the products are added:
  //   me. Kiano 20 ml (slim)  101.1     Fella (cylinder)     224.1
  //   Malaki                  252.1     Oud Oman             255.9
  //   Arba                    260.6     me. Emiro 100 ml     340.3
  //   me. Rose Vanilla 100 ml 346.4     Velvet 100 ml        413.7
};

/** Just the numbers, for places that only need a weight by SKU. */
export const SIZE_WEIGHTS_GRAMS: Record<string, number> = Object.fromEntries(
  Object.entries(SIZE_WEIGHTS).map(([sku, w]) => [sku, w.grams]),
);
