const YEAR_FOLDERS = {
  2026: "10nBZIL1KUZv0rEEJYObfAiMw4aMZGmFr",
  2025: "1n1piXjV7NRd6IeS-0Swv3tE0lQaFnwWj",
  2024: "1n5CAJTT43loXkQ8FDLwLxemslJEEPPM-",
  2023: "1EMfZi_pnE6wx9YqhWcMBgwvCy2FA6C32",
  2022: "10ObWwLe48OXkgdQC9DH01IexuM7qw0SY",
  2021: "1PtUYdLqJBo5toMQxcd0Op3iXxnBA41Oz",
  2020: "1muKvToYwWqUTpdp2neubJA95agoNEhel",
  2019: "1wfmPI7HMthRwC8RfXnEjG8Z1E9eL5Nc2",
  2018: "178vCvejaOogHQBNVnr6oWRnIozIpy1Lf",
  2017: "1vmwYxoMk3JdqcQb6EhCVDyvjN_ctLqa4",
  2016: "1jf_5Pb_aj4IV9VzomAytae-xmbzdyiyS",
  2015: "1LJmx-yXmoYsG9zjmunp4C2s7CMKlR-79",
  2014: "1m125a8i8jvoXMDpoxself9P4_d_Cajvz",
  2013: "1xOqXps9HPFMi2A2jE9pp-SxiFEbb-FZG",
  2012: "1M0KJElPlrusa4qmC3GJPBQphYH8jgg5m",
  2011: "13oFP6Sg8SrubGGzkv5SL092Azvw4Q7yW",
  2010: "1C7lA_sK-roGBHLwMpeknRWg7fuuaymjB",
  2009: "1G0nSHZkGKY-fmWoT3miqhrzV_rdkgvFh",
  2008: "1qxeMYq6QvLdBVOj9ruqs5SFTp7bExMbe",
  2007: "1oaOds08A3RqKiAKYeXRF-pYLdWT11j_3",
};

const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "tif", "tiff", "bmp", "avif",
]);
const VIDEO_EXTENSIONS = new Set([
  "mp4", "mov", "m4v", "webm", "avi", "mkv", "3gp", "mpeg", "mpg", "mts", "m2ts",
]);

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_FOLDERS_PER_YEAR = 300;
const FETCH_CONCURRENCY = 6;
const folderCache = new Map();

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanTitle(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
}

function classify(name) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = match?.[1] ?? "";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  return null;
}

function parseEntries(html) {
  const entries = [];
  const seen = new Set();
  const anchorPattern = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html)) !== null) {
    const href = decodeEntities(match[1]);
    const body = match[2];
    const titleMatch = body.match(/class="flip-entry-title"[^>]*>([\s\S]*?)<\/div>/i);
    const name = titleMatch ? cleanTitle(titleMatch[1]) : "";

    const folderMatch = href.match(/\/drive\/folders\/([-\w]{10,})/i);
    if (folderMatch) {
      const key = `folder:${folderMatch[1]}`;
      if (!seen.has(key)) {
        seen.add(key);
        entries.push({ kind: "folder", id: folderMatch[1], name });
      }
      continue;
    }

    const fileMatch = href.match(/\/file\/d\/([-\w]{10,})/i);
    if (!fileMatch) continue;

    const mediaKind = classify(name);
    if (!mediaKind) continue;

    const key = `file:${fileMatch[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      entries.push({ kind: mediaKind, id: fileMatch[1], name });
    }
  }

  // Google occasionally changes the wrapper markup while retaining Drive URLs.
  // Fallback folder discovery keeps recursive traversal working even if titles
  // cannot be associated with every folder entry.
  const folderPattern = /https:\/\/drive\.google\.com\/drive\/folders\/([-\w]{10,})/gi;
  while ((match = folderPattern.exec(html)) !== null) {
    const key = `folder:${match[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      entries.push({ kind: "folder", id: match[1], name: "" });
    }
  }

  return entries;
}

async function fetchFolder(folderId) {
  const cached = folderCache.get(folderId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.entries;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(
      `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}#list`,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; ShriramSamruddhiGallery/1.0; +https://shriramsamruddhipujo.org)",
          accept: "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Google Drive returned ${response.status} for folder ${folderId}`);
    }

    const entries = parseEntries(await response.text());
    folderCache.set(folderId, { timestamp: Date.now(), entries });
    return entries;
  } finally {
    clearTimeout(timeout);
  }
}

async function crawlYear(rootId) {
  const queue = [rootId];
  const visitedFolders = new Set();
  const media = new Map();

  while (queue.length && visitedFolders.size < MAX_FOLDERS_PER_YEAR) {
    const batch = [];
    while (queue.length && batch.length < FETCH_CONCURRENCY) {
      const folderId = queue.shift();
      if (!folderId || visitedFolders.has(folderId)) continue;
      visitedFolders.add(folderId);
      batch.push(folderId);
    }

    if (!batch.length) continue;

    const results = await Promise.allSettled(batch.map((folderId) => fetchFolder(folderId)));
    for (const result of results) {
      if (result.status !== "fulfilled") continue;

      for (const entry of result.value) {
        if (entry.kind === "folder") {
          if (!visitedFolders.has(entry.id)) queue.push(entry.id);
          continue;
        }

        if (!media.has(entry.id)) {
          media.set(entry.id, {
            id: entry.id,
            name: entry.name || `Pujo media ${entry.id.slice(0, 6)}`,
            type: entry.kind,
          });
        }
      }
    }
  }

  return Array.from(media.values());
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawYear = Array.isArray(req.query.year) ? req.query.year[0] : req.query.year;
  const year = Number(rawYear);
  const rootId = YEAR_FOLDERS[year];

  if (!rootId) {
    return res.status(400).json({ error: "A gallery year from 2007 to 2026 is required" });
  }

  try {
    const media = await crawlYear(rootId);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json({
      year,
      sourceFolderId: rootId,
      count: media.length,
      media,
    });
  } catch (error) {
    console.error("Gallery crawl failed", { year, error });
    return res.status(502).json({
      error: "Unable to read the public Google Drive gallery right now",
      year,
    });
  }
}
