// Maps filenames stored in the DB to bundled asset URLs.
import hero from "@/assets/hero.jpg";
import catSuits from "@/assets/cat-suits.jpg";
import catKurtis from "@/assets/cat-kurtis.jpg";
import catSarees from "@/assets/cat-sarees.jpg";
import catDupattas from "@/assets/cat-dupattas.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

const map: Record<string, string> = {
  "hero.jpg": hero,
  "cat-suits.jpg": catSuits,
  "cat-kurtis.jpg": catKurtis,
  "cat-sarees.jpg": catSarees,
  "cat-dupattas.jpg": catDupattas,
  "p1.jpg": p1,
  "p2.jpg": p2,
  "p3.jpg": p3,
  "p4.jpg": p4,
  "p5.jpg": p5,
  "p6.jpg": p6,
};

export const HERO_IMG = hero;

export function resolveImage(filename?: string | null): string {
  if (!filename) return p1;
  return map[filename] ?? filename;
}

export const CATEGORY_IMG: Record<string, string> = {
  suits: catSuits,
  kurtis: catKurtis,
  "kurti-pant-sets": p4,
  sarees: catSarees,
  dupattas: catDupattas,
  trousers: p6,
  "new-arrivals": p1,
  "festive-collection": p5,
  "best-sellers": p2,
};
