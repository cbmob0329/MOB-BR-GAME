/**
 * Resolves asset URLs for both supported GitHub layouts:
 *
 * A: /index.html + /back + /icon + /item
 * B: /MOB-BR/index.html + /back + /icon + /item
 *
 * GitHub Pages is case-sensitive. Asset paths must use lower-case directory
 * names exactly as stored in the repository.
 */

export const ASSET_RESOLVER_VERSION =
  "mobbr-asset-resolver-1.0.0";

const PREFIX_CANDIDATES = Object.freeze([
  "",
  "../",
  "../../",
]);

let detectedPrefix = "";
let detectionComplete = false;

function isExternalPath(path) {
  return /^(?:[a-z]+:|\/\/|#|data:|blob:)/i.test(String(path));
}

function cleanRelativePath(path) {
  return String(path)
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "");
}

function loadImage(path, timeoutMs = 1200) {
  if (typeof Image === "undefined") {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = path;
    setTimeout(() => finish(false), timeoutMs);
  });
}

export async function detectAssetPrefix(
  probePath = "back/local.png",
) {
  if (detectionComplete) {
    return detectedPrefix;
  }
  const clean = cleanRelativePath(probePath);
  for (const prefix of PREFIX_CANDIDATES) {
    if (await loadImage(`${prefix}${clean}`)) {
      detectedPrefix = prefix;
      detectionComplete = true;
      document?.documentElement?.setAttribute(
        "data-asset-prefix",
        prefix || "same-level",
      );
      return detectedPrefix;
    }
  }
  detectionComplete = true;
  detectedPrefix = "";
  document?.documentElement?.setAttribute(
    "data-asset-prefix",
    "not-found",
  );
  return detectedPrefix;
}

export function assetPath(path) {
  if (!path || isExternalPath(path)) {
    return path;
  }
  const raw = String(path);
  if (raw.startsWith("../")) {
    return raw;
  }
  return `${detectedPrefix}${cleanRelativePath(raw)}`;
}

function assetCandidates(path) {
  if (!path || isExternalPath(path)) return [path];
  const clean = cleanRelativePath(
    String(path).replace(/^(\.\.\/)+/, ""),
  );
  const ordered = [
    assetPath(clean),
    ...PREFIX_CANDIDATES.map((prefix) => `${prefix}${clean}`),
  ];
  return [...new Set(ordered)];
}

function applyImageCandidate(image, index) {
  const candidates = JSON.parse(
    image.dataset.assetCandidates ?? "[]",
  );
  if (index >= candidates.length) {
    image.classList.add("asset-missing");
    image.setAttribute("aria-hidden", "true");
    return;
  }
  image.dataset.assetCandidateIndex = String(index);
  image.src = candidates[index];
}

function prepareImage(image) {
  if (!(image instanceof HTMLImageElement)) return;
  if (image.dataset.assetManaged === "true") return;
  const original =
    image.getAttribute("src") ??
    image.dataset.src ??
    "";
  if (!original || isExternalPath(original)) return;
  image.dataset.assetManaged = "true";
  image.dataset.assetOriginal = original;
  image.dataset.assetCandidates = JSON.stringify(
    assetCandidates(original),
  );
  applyImageCandidate(image, 0);
}

export function installAssetFallbacks(
  root = document,
) {
  if (!root || root.documentElement?.dataset.assetFallbacks === "installed") {
    return;
  }
  root.documentElement.dataset.assetFallbacks = "installed";

  root.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;
      if (image.dataset.assetManaged !== "true") {
        prepareImage(image);
        return;
      }
      const nextIndex =
        Number(image.dataset.assetCandidateIndex ?? 0) + 1;
      applyImageCandidate(image, nextIndex);
    },
    true,
  );

  const scan = (node) => {
    if (node instanceof HTMLImageElement) {
      prepareImage(node);
    }
    node?.querySelectorAll?.("img").forEach(prepareImage);
  };

  scan(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach(scan);
    }
  });
  observer.observe(root.documentElement ?? root, {
    childList: true,
    subtree: true,
  });
}
