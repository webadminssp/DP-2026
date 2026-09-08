/**
 * Public Google Drive source for the Pujo gallery.
 *
 * Media may live anywhere below a year folder. The production `/api/gallery`
 * endpoint crawls those folders recursively; the browser then chooses a fresh,
 * duplicate-free sample on each gallery page load.
 */

export const galleryDriveRootId = "1GF_K6grQleE3clM6YS7V04lRJQAcm5Hr";

export const galleryYears = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017,
  2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007,
] as const;

export type GalleryYear = (typeof galleryYears)[number];
