const CACHE_TTL = 5 * 60 * 1000;
const CACHE_PREFIX = "pujo-gallery-v2:";

function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function selectGalleryPreview(pool, year) {
    const seen = new Set();
    const unique = pool.filter((item) => {
        if (!item || typeof item.id !== "string" || !item.id || seen.has(item.id)
            || !["image", "video"].includes(item.type)) return false;
        seen.add(item.id);
        return true;
    });
    const images = shuffle(unique.filter((item) => item.type === "image"));
    const videos = shuffle(unique.filter((item) => item.type === "video"));
    let selected;
    let candidates;
    if (year === 2026) {
        // Prefer camera photographs; do not download images to choose a sample.
        const isPhoto = (item) => /^(DSC|IMG|PXL|DSCF|DSCN|DSC_|WhatsApp Image)/i.test(item.name || "");
        candidates = [...images.filter(isPhoto), ...images.filter((item) => !isPhoto(item))];
        selected = candidates.slice(0, 18);
    } else {
        const videoCount = Math.min(videos.length, Math.max(1, 6 - images.length));
        selected = shuffle([...images.slice(0, 6 - videoCount), ...videos.slice(0, videoCount)]);
        candidates = [...images, ...videos];
    }
    const selectedIds = new Set(selected.map((item) => item.id));
    return { selected, reserve: candidates.filter((item) => !selectedIds.has(item.id)) };
}

export function thumbnailSizes(year) {
    return year === 2026
        ? "(min-width: 816px) 122px, (min-width: 640px) calc((100vw - 88px) / 6), (min-width: 560px) and (orientation: landscape) calc((100vw - 72px) / 6), calc((100vw - 48px) / 3)"
        : "(min-width: 788px) 91px, (min-width: 640px) calc((78vw - 68px) / 6), (min-width: 560px) and (orientation: landscape) calc((78vw - 55px) / 6), calc((78vw - 37px) / 3)";
}

export function readGalleryCache(storage, year, now = Date.now()) {
    try {
        const cached = JSON.parse(storage.getItem(CACHE_PREFIX + year) || "null");
        if (cached && now >= cached.savedAt && now - cached.savedAt < CACHE_TTL
            && cached.data.year === year && Array.isArray(cached.data.media)
            && cached.data.media.length > 0) return cached.data;
    } catch { /* Storage may be unavailable or full in private browsing. */ }
    return null;
}

export function writeGalleryCache(storage, year, data, now = Date.now()) {
    try {
        if (data.year === year && Array.isArray(data.media) && data.media.length > 0) {
            storage.setItem(CACHE_PREFIX + year, JSON.stringify({ savedAt: now, data }));
        }
    } catch { /* Caching is optional; the gallery must still load. */ }
}
