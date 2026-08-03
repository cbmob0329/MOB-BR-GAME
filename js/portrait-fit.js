/**
 * MOB BR shared visible-bounds portrait fitting.
 *
 * Alpha bounds are cached per image source, while final scale is calculated
 * from each screen's actual image box. No role-specific size multiplier is
 * used, so IGL / ATK / SUP and player / CPU share the same fitting rule.
 */

export const PORTRAIT_FIT_VERSION =
  "mobbr-portrait-fit-1.0.0";

const ALPHA_BOUNDS_CACHE =
  new Map();

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function sourceKey(image) {
  return image.currentSrc || image.src || "";
}

function measureAlphaBounds(image) {
  const key = sourceKey(image);
  if (key && ALPHA_BOUNDS_CACHE.has(key)) {
    return ALPHA_BOUNDS_CACHE.get(key);
  }
  if (
    !image?.naturalWidth ||
    !image?.naturalHeight ||
    typeof document === "undefined"
  ) {
    return null;
  }

  try {
    const maximumSide = 256;
    const ratio = Math.min(
      1,
      maximumSide / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;

    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha < 20) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) return null;

    const bounds = {
      left: minX / width,
      right: (maxX + 1) / width,
      top: minY / height,
      bottom: (maxY + 1) / height,
      width: (maxX - minX + 1) / width,
      height: (maxY - minY + 1) / height,
    };
    if (key) ALPHA_BOUNDS_CACHE.set(key, bounds);
    return bounds;
  } catch (_error) {
    return null;
  }
}

export function fitPortraitImage(
  image,
  {
    scaleProperty = "--portrait-fit-scale",
    translateProperty = "--portrait-fit-y",
    targetWidthRate = 0.84,
    targetHeightRate = 0.82,
    minimumScale = 0.52,
    maximumScale = 1.42,
  } = {},
) {
  const key = sourceKey(image);
  if (!image || !key || key.includes("/icon/deth.png")) return null;

  const apply = () => {
    const bounds = measureAlphaBounds(image);
    const boxWidth = Number(image.offsetWidth) || Number(image.clientWidth);
    const boxHeight = Number(image.offsetHeight) || Number(image.clientHeight);
    if (!bounds || boxWidth <= 0 || boxHeight <= 0) {
      image.style.setProperty(scaleProperty, "1");
      image.style.setProperty(translateProperty, "0px");
      image.dataset.portraitBalanced = "true";
      return { scale: 1, translateY: 0 };
    }

    const containScale = Math.min(
      boxWidth / image.naturalWidth,
      boxHeight / image.naturalHeight,
    );
    const renderedWidth = image.naturalWidth * containScale;
    const renderedHeight = image.naturalHeight * containScale;
    const visibleWidth = renderedWidth * bounds.width;
    const visibleHeight = renderedHeight * bounds.height;
    const widthScale =
      (boxWidth * targetWidthRate) / Math.max(1, visibleWidth);
    const heightScale =
      (boxHeight * targetHeightRate) / Math.max(1, visibleHeight);
    const scale = clamp(
      Math.min(widthScale, heightScale),
      minimumScale,
      maximumScale,
    );

    const transparentBottom = renderedHeight * (1 - bounds.bottom);
    const translateY = clamp(
      transparentBottom * scale,
      0,
      boxHeight * 0.16,
    );

    image.style.setProperty(scaleProperty, scale.toFixed(4));
    image.style.setProperty(
      translateProperty,
      `${translateY.toFixed(2)}px`,
    );
    image.dataset.portraitBalanced = "true";
    return { scale, translateY, visibleWidth, visibleHeight };
  };

  image.dataset.portraitBalanced = "pending";
  if (image.complete && image.naturalWidth > 0) {
    return apply();
  }
  image.addEventListener(
    "load",
    () => requestAnimationFrame(apply),
    { once: true },
  );
  return null;
}

export function fitPortraits(root, selectors, options = {}) {
  if (!root?.querySelectorAll) return 0;
  const images = new Set();
  for (const selector of selectors) {
    for (const image of root.querySelectorAll(selector)) {
      if (image instanceof HTMLImageElement) images.add(image);
    }
  }
  for (const image of images) {
    fitPortraitImage(image, options);
  }
  return images.size;
}

export function clearPortraitFitCache() {
  ALPHA_BOUNDS_CACHE.clear();
}
