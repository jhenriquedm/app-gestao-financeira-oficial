import { describe, it, expect } from 'vitest';
import {
  validateImageSize,
  validateImageType,
  calculateCropClamping,
  MAX_PROFILE_PHOTO_SIZE_BYTES,
} from '../utils/photoValidator';

describe('Profile Photo Validation & Cropping', () => {
  describe('validateImageSize', () => {
    it('accepts files under or equal to 10MB', () => {
      const validSmall = validateImageSize(500 * 1024); // 500 KB
      expect(validSmall.valid).toBe(true);

      const validLimit = validateImageSize(MAX_PROFILE_PHOTO_SIZE_BYTES); // Exactly 10MB
      expect(validLimit.valid).toBe(true);
    });

    it('rejects files larger than 10MB with friendly message', () => {
      const overLimit = validateImageSize(10 * 1024 * 1024 + 1); // 10MB + 1 byte
      expect(overLimit.valid).toBe(false);
      expect(overLimit.error).toContain('10MB');

      const hugeFile = validateImageSize(25 * 1024 * 1024); // 25MB
      expect(hugeFile.valid).toBe(false);
    });

    it('rejects empty files with zero bytes', () => {
      const zeroFile = validateImageSize(0);
      expect(zeroFile.valid).toBe(false);
    });
  });

  describe('validateImageType', () => {
    it('accepts standard image MIME types', () => {
      expect(validateImageType('image/png').valid).toBe(true);
      expect(validateImageType('image/jpeg').valid).toBe(true);
      expect(validateImageType('image/webp').valid).toBe(true);
      expect(validateImageType('image/gif').valid).toBe(true);
      expect(validateImageType('image/svg+xml').valid).toBe(true);
      expect(validateImageType('image/avif').valid).toBe(true);
    });

    it('accepts valid extensions when MIME is generic or empty', () => {
      expect(validateImageType('', 'avatar.png').valid).toBe(true);
      expect(validateImageType('application/octet-stream', 'photo.jpg').valid).toBe(true);
      expect(validateImageType('', 'my-pic.WEBP').valid).toBe(true);
    });

    it('rejects non-image files', () => {
      const pdf = validateImageType('application/pdf', 'doc.pdf');
      expect(pdf.valid).toBe(false);
      expect(pdf.error).toBeDefined();

      const text = validateImageType('text/plain', 'notes.txt');
      expect(text.valid).toBe(false);
    });
  });

  describe('calculateCropClamping', () => {
    it('calculates scale and boundaries correctly for square viewports', () => {
      const viewport = 280;
      const width = 800;
      const height = 600;
      const zoom = 1.5;

      const calc = calculateCropClamping(viewport, width, height, zoom, false);
      expect(calc.totalScale).toBeGreaterThan(0);
      expect(calc.maxOffsetX).toBeGreaterThan(0);
      expect(calc.maxOffsetY).toBeGreaterThan(0);

      // Clamping within bounds
      const clampedInside = calc.clamp(10, -10);
      expect(clampedInside.x).toBe(10);
      expect(clampedInside.y).toBe(-10);

      // Clamping out-of-bounds offset
      const clampedOverflow = calc.clamp(9999, -9999);
      expect(clampedOverflow.x).toBe(calc.maxOffsetX);
      expect(clampedOverflow.y).toBe(-calc.maxOffsetY);
    });

    it('handles 90-degree rotation correctly by swapping dimensions', () => {
      const viewport = 280;
      const width = 1200;
      const height = 600;

      const rotated = calculateCropClamping(viewport, width, height, 1, true);

      expect(rotated.totalScale).toBeGreaterThan(0);
      expect(rotated.maxOffsetX).toBeGreaterThanOrEqual(0);
    });
  });
});
