/**
 * Gallery photo manifest.
 *
 * Placeholder data for now. When the real photos land, drop them into
 * `src/assets/gallery/<year>/` and swap `thumb`/`full` for imported
 * `ImageMetadata` — GalleryGrid.astro reads `ratio` off this manifest, so the
 * layout stays identical and only this file changes. Astro's image pipeline
 * (AVIF/WebP + srcset) only kicks in for local assets, not these remote URLs.
 */

export type Photo = {
  id: string;
  year: number;
  /** width / height — drives the justified-row layout, so it must be accurate. */
  ratio: number;
  thumb: string;
  full: string;
  alt: string;
};

const placeholder = (w: number, h: number) =>
  `https://placehold.co/${w}x${h}/cccccc/cccccc`;

/** Ratios per year, chosen to mix landscape, portrait and square. */
const ratiosByYear: Record<number, number[]> = {
  2025: [1.5, 0.75, 1.33, 1, 1.78, 0.8, 1.5, 1.2],
  2024: [0.67, 1.6, 1, 1.33, 0.75, 1.78, 1.4],
  2023: [1.33, 1, 0.8, 1.5, 1.78, 0.7, 1.25, 1.6],
  2022: [1.78, 0.75, 1.2, 1, 1.5, 0.8],
  2021: [1, 1.33, 0.7, 1.6, 1.4],
  2020: [1.5, 0.8, 1.33, 1, 1.78, 0.75, 1.2],
};

/** Thumbnails are requested at ~520px on the long edge; lightbox at ~1600px. */
const dims = (ratio: number, long: number) =>
  ratio >= 1
    ? ([long, Math.round(long / ratio)] as const)
    : ([Math.round(long * ratio), long] as const);

export const photos: Photo[] = Object.entries(ratiosByYear)
  .map(([year, ratios]) => ({ year: Number(year), ratios }))
  .sort((a, b) => b.year - a.year)
  .flatMap(({ year, ratios }) =>
    ratios.map((ratio, i) => {
      const [tw, th] = dims(ratio, 520);
      const [fw, fh] = dims(ratio, 1600);
      return {
        id: `${year}-${i + 1}`,
        year,
        ratio,
        thumb: placeholder(tw, th),
        full: placeholder(fw, fh),
        alt: `Durga Pujo ${year} — photo ${i + 1}`,
      };
    }),
  );

/** Newest first, for the filter rail. */
export const years: number[] = [...new Set(photos.map((p) => p.year))].sort(
  (a, b) => b - a,
);
