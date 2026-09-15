import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Crop 
} from 'lucide-react';
import { calculateCropClamping } from '../utils/photoValidator';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Multi-touch tracking for pinch to zoom
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  const viewportRef = useRef<HTMLDivElement>(null);
  const VIEWPORT_SIZE = 280; // Size of circular crop area in px

  // Load image element when imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setImageElement(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calculate base scale and clamping via shared helper
  const isRotated90 = rotation % 180 !== 0;
  const imgW = imageElement ? imageElement.naturalWidth : 1;
  const imgH = imageElement ? imageElement.naturalHeight : 1;

  const { totalScale, maxOffsetX, maxOffsetY, clamp } = calculateCropClamping(
    VIEWPORT_SIZE,
    imgW,
    imgH,
    zoom,
    isRotated90
  );

  const clamped = clamp(offset.x, offset.y);
  const clampedX = clamped.x;
  const clampedY = clamped.y;

  // Pointer event handlers for drag and pinch
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - clampedX, y: e.clientY - clampedY });
    } else if (activePointersRef.current.size === 2) {
      // Begin pinch
      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      pinchStartDistRef.current = dist;
      pinchStartZoomRef.current = zoom;
      setIsDragging(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2 && pinchStartDistRef.current) {
      // Handling pinch zoom
      const points = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const ratio = currentDist / pinchStartDistRef.current;
      const nextZoom = Math.min(3.5, Math.max(1, pinchStartZoomRef.current * ratio));
      setZoom(nextZoom);
    } else if (isDragging && activePointersRef.current.size === 1) {
      const nextX = e.clientX - dragStart.x;
      const nextY = e.clientY - dragStart.y;
      setOffset({
        x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextX)),
        y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextY)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer already released
    }
    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }
    if (activePointersRef.current.size === 1) {
      const remainingPoint = Array.from(activePointersRef.current.values())[0];
      setDragStart({ x: remainingPoint.x - clampedX, y: remainingPoint.y - clampedY });
      setIsDragging(true);
    } else if (activePointersRef.current.size === 0) {
      setIsDragging(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3.5, Math.max(1, +(prev + delta).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    // Reset offset when rotating to avoid weird leaps
    setOffset({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirmCrop = useCallback(() => {
    if (!imageElement) return;

    const OUTPUT_SIZE = 512; // Crisp resolution for avatar
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Factor from preview viewport to output canvas
    const S = OUTPUT_SIZE / VIEWPORT_SIZE;

    ctx.save();
    // 1. Move to canvas center
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

    // 2. Apply user pan offset scaled to canvas
    ctx.translate(clampedX * S, clampedY * S);

    // 3. Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // 4. Apply total scale
    const scaleFactor = totalScale * S;
    ctx.scale(scaleFactor, scaleFactor);

    // 5. Draw image centered
    ctx.drawImage(
      imageElement,
      -imageElement.naturalWidth / 2,
      -imageElement.naturalHeight / 2,
      imageElement.naturalWidth,
      imageElement.naturalHeight
    );

    ctx.restore();

    // Export as high quality JPEG (or PNG if has alpha)
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedDataUrl);
  }, [imageElement, clampedX, clampedY, rotation, totalScale, onCropComplete]);

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div 
        id="image-cropper-backdrop"
        className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          id="image-cropper-card"
          className="bg-neutral-900 text-white rounded-3xl max-w-sm w-full shadow-2xl border border-neutral-800 overflow-hidden flex flex-col max-h-[95vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Crop className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-100">Enquadrar Foto de Perfil</h3>
                <p className="text-[11px] text-neutral-400">Arraste para posicionar e ajuste o zoom</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Crop Viewport */}
          <div className="p-4 flex flex-col items-center justify-center bg-neutral-950/70 relative">
            <div
              ref={viewportRef}
              style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              className="relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing touch-none bg-neutral-900 select-none shadow-inner border border-neutral-800"
            >
              {/* Image with transform */}
              {imageElement && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(${clampedX}px, ${clampedY}px) rotate(${rotation}deg) scale(${totalScale})`,
                    transformOrigin: 'center center',
                    willChange: 'transform',
                    transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                  }}
                  className="pointer-events-none"
                >
                  <img
                    src={imageSrc}
                    alt="Foto original"
                    draggable={false}
                    className="max-w-none block select-none pointer-events-none"
                    style={{
                      width: imageElement.naturalWidth,
                      height: imageElement.naturalHeight,
                    }}
                  />
                </div>
              )}

              {/* Dark Vignette with Circular Cutout Mask */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                  borderRadius: '50%',
                  border: '2px solid rgba(16, 185, 129, 0.85)',
                }}
              />

              {/* Subtle Center / Guide Grid */}
              <div className="absolute inset-0 pointer-events-none rounded-full flex items-center justify-center">
                <div className="w-full h-px bg-emerald-400/20" />
                <div className="h-full w-px bg-emerald-400/20 absolute" />
              </div>

              {/* Hint badge */}
              <div className="absolute top-2 left-2 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-neutral-300">
                <Move className="w-3 h-3 text-emerald-400" />
                <span>Arraste para mover</span>
              </div>
            </div>

            {/* Quick helper note */}
            <p className="text-[11px] text-neutral-400 mt-2 text-center">
              Apenas a área dentro do círculo verde será visível no seu perfil.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="p-4 space-y-3.5 bg-neutral-900 border-t border-neutral-800">
            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="font-semibold flex items-center gap-1 text-neutral-300">
                  <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                  Zoom
                </span>
                <span className="font-mono text-[11px] text-neutral-400">{zoom.toFixed(1)}x</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.2).toFixed(2)))}
                  className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.2).toFixed(2)))}
                  className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Girar 90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Centralizar</span>
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-800">
              <button
                type="button"
                id="btn-cancel-crop"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                id="btn-confirm-crop"
                onClick={handleConfirmCrop}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Enquadramento</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
