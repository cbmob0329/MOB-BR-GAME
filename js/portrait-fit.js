/**
 * MOB BR shared visible-bounds portrait fitting.
 *
 * Alpha bounds are cached per image source, while final scale is calculated
 * from each screen's actual image box. No role-specific size multiplier is
 * used, so IGL / ATK / SUP and player / CPU share the same fitting rule.
 */

export const PORTRAIT_FIT_VERSION =
  "mobbr-portrait-fit-1.1.0";

const ALPHA_BOUNDS_CACHE =
  new Map();

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculatePortraitFitScale({
  boxWidth,
  boxHeight,
  visibleWidth,
  visibleHeight,
  targetHeightRate = 0.80,
  widthLimitRate = 1.24,
  minimumScale = 0.46,
  maximumScale = 1.70,
}) {
  const normalizedBoxWidth =
    Math.max(
      1,
      Number(boxWidth) || 0,
    );
  const normalizedBoxHeight =
    Math.max(
      1,
      Number(boxHeight) || 0,
    );
  const normalizedVisibleWidth =
    Math.max(
      1,
      Number(visibleWidth) || 0,
    );
  const normalizedVisibleHeight =
    Math.max(
      1,
      Number(visibleHeight) || 0,
    );
  const heightScale =
    (
      normalizedBoxHeight *
      targetHeightRate
    ) /
    normalizedVisibleHeight;
  const widthLimitScale =
    (
      normalizedBoxWidth *
      widthLimitRate
    ) /
    normalizedVisibleWidth;
  const scale =
    clamp(
      Math.min(
        heightScale,
        widthLimitScale,
      ),
      minimumScale,
      maximumScale,
    );

  return {
    scale,
    heightScale,
    widthLimitScale,
    finalVisibleHeight:
      normalizedVisibleHeight *
      scale,
    finalVisibleWidth:
      normalizedVisibleWidth *
      scale,
  };
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
    targetWidthRate = 1.24,
    targetHeightRate = 0.80,
    minimumScale = 0.46,
    maximumScale = 1.70,
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
    const computed =
      typeof getComputedStyle === "function"
        ? getComputedStyle(image)
        : null;
    const cssHeightRate =
      Number.parseFloat(
        computed?.getPropertyValue(
          "--portrait-target-height-rate",
        ) ?? "",
      );
    const cssWidthLimitRate =
      Number.parseFloat(
        computed?.getPropertyValue(
          "--portrait-width-limit-rate",
        ) ?? "",
      );
    const resolvedHeightRate =
      Number.isFinite(cssHeightRate)
        ? cssHeightRate
        : targetHeightRate;
    const resolvedWidthLimitRate =
      Number.isFinite(cssWidthLimitRate)
        ? cssWidthLimitRate
        : targetWidthRate;

    // Normalize visible character HEIGHT first. IGL/ATK artwork often has
    // wide arms or weapons, while SUP artwork is narrow and tall. Equal width
    // and height targets made the wide roles short and SUP look oversized.
    // Width is now only an overflow safety limit.
    const fit =
      calculatePortraitFitScale({
        boxWidth,
        boxHeight,
        visibleWidth,
        visibleHeight,
        targetHeightRate:
          resolvedHeightRate,
        widthLimitRate:
          resolvedWidthLimitRate,
        minimumScale,
        maximumScale,
      });
    const scale =
      fit.scale;

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
    image.dataset.portraitFitScale =
      scale.toFixed(4);
    image.dataset.portraitVisibleHeight =
      visibleHeight.toFixed(2);
    image.dataset.portraitVisibleWidth =
      visibleWidth.toFixed(2);
    return {
      scale,
      translateY,
      visibleWidth,
      visibleHeight,
      resolvedHeightRate,
      resolvedWidthLimitRate,
    };
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
