/**
 * Profile photo validation and helper utilities
 */

export const MAX_PROFILE_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'svg',
  'avif',
  'bmp',
];

/**
 * Validates if the file size is within the allowed limit (10MB)
 */
export function validateImageSize(sizeInBytes: number): { valid: boolean; error?: string } {
  if (sizeInBytes <= 0) {
    return { valid: false, error: 'O arquivo de imagem selecionado está vazio.' };
  }
  if (sizeInBytes > MAX_PROFILE_PHOTO_SIZE_BYTES) {
    return {
      valid: false,
      error: 'O tamanho da foto não pode ultrapassar 10MB.',
    };
  }
  return { valid: true };
}

/**
 * Validates if the file MIME type or filename is an acceptable image format
 */
export function validateImageType(mimeType: string, filename = ''): { valid: boolean; error?: string } {
  const isMimeValid = mimeType ? mimeType.toLowerCase().startsWith('image/') : false;
  
  const ext = filename.split('.').pop()?.toLowerCase();
  const isExtValid = ext ? ALLOWED_IMAGE_EXTENSIONS.includes(ext) : false;

  if (isMimeValid || isExtValid) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Por favor, selecione um formato de foto válido (PNG, JPG, WEBP, etc.).',
  };
}

/**
 * Calculates display scale and offset bounds for the photo cropper viewport
 */
export function calculateCropClamping(
  viewportSize: number,
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  isRotated90 = false
) {
  const effectiveWidth = isRotated90 ? imageHeight : imageWidth;
  const effectiveHeight = isRotated90 ? imageWidth : imageHeight;

  const baseScale = Math.max(viewportSize / effectiveWidth, viewportSize / effectiveHeight);
  const totalScale = baseScale * zoom;

  const dispW = effectiveWidth * totalScale;
  const dispH = effectiveHeight * totalScale;

  const maxOffsetX = Math.max(0, (dispW - viewportSize) / 2);
  const maxOffsetY = Math.max(0, (dispH - viewportSize) / 2);

  return {
    baseScale,
    totalScale,
    maxOffsetX,
    maxOffsetY,
    clamp: (x: number, y: number) => ({
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, y)),
    }),
  };
}
