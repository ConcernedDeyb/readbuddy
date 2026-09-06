'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  X,
  Trash2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface AvatarCropperModalProps {
  open: boolean;
  currentAvatarUrl?: string | null;
  userName: string;
  accent?: string;
  onSave: (croppedDataUrl: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export function AvatarCropperModal({
  open,
  currentAvatarUrl,
  userName,
  accent = '#1F4D3A',
  onSave,
  onRemove,
  onClose,
}: AvatarCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Initialize with current avatar or reset
  useEffect(() => {
    if (open) {
      if (currentAvatarUrl && currentAvatarUrl.startsWith('data:image')) {
        setImageSrc(currentAvatarUrl);
      } else {
        setImageSrc(null);
      }
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setErrorMessage(null);
    }
  }, [open, currentAvatarUrl]);

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      imageRef.current = null;
      setPreviewDataUrl(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setPan({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      renderCanvas();
    };
    img.onerror = () => {
      setErrorMessage('Failed to load image. Please select a valid JPG, PNG, or WEBP file.');
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw canvas whenever zoom, pan, or rotation changes
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    // Center point for rotation and scale
    ctx.translate(size / 2 + pan.x, size / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Compute aspect-ratio fitted base dimensions
    const imgRatio = img.naturalWidth / img.naturalHeight;
    let drawW = size;
    let drawH = size;
    if (imgRatio > 1) {
      drawW = size * imgRatio;
      drawH = size;
    } else {
      drawW = size;
      drawH = size / imgRatio;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Generate live preview
    try {
      const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewDataUrl(previewUrl);
    } catch (e) {}
  }, [zoom, pan, rotation]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  function handleFileSelect(file: File) {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read selected file.');
    };
    reader.readAsDataURL(file);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLElement>) {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleTouchStart(e: React.TouchEvent<HTMLElement>) {
    if (!imageSrc || e.touches.length === 0) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  }

  function handleTouchMove(e: React.TouchEvent<HTMLElement>) {
    if (!isDragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }

  function handleTouchEnd() {
    setIsDragging(false);
  }

  function handleRotate() {
    setRotation((prev) => (prev + 90) % 360);
  }

  function handleReset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }

  function handleSaveCrop() {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    // Output clean 256x256 cropped square image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = 256;
    outputCanvas.height = 256;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0, 256, 256);
    const finalDataUrl = outputCanvas.toDataURL('image/jpeg', 0.9);
    onSave(finalDataUrl);
    onClose();
  }

  function handleRemovePhoto() {
    if (onRemove) {
      onRemove();
    }
    setImageSrc(null);
    onClose();
  }

  if (!open) return null;

  const initials = (userName || 'User')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0F2119]/75 backdrop-blur-[2px] select-none rb-fade-in-up">
      <div
        className="w-full max-w-lg bg-[#FFFDF8] border-3 border-[#1F4D3A] rounded-2xl shadow-[6px_6px_0px_#1F4D3A] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#DED2B4] flex items-center justify-between bg-[#F5EFE0]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E8873A] text-white border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A]">
              <Crop className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <h2
                className="font-serif font-bold text-base sm:text-lg text-[#1F4D3A] leading-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Profile Photo & Cropper
              </h2>
              <p
                className="text-xs font-mono font-medium text-[#8A5A1E]"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Adjust, zoom, and reposition your avatar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-[#1F4D3A] p-1.5 rounded-lg border-2 border-transparent hover:border-[#1F4D3A] transition-all cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FDF2E9] border-2 border-[#F0C99A] text-xs font-semibold text-[#B4602E] flex items-center gap-2 font-sans">
              <X className="w-4 h-4 shrink-0 text-[#B4602E]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!imageSrc ? (
            /* Upload / Drag & Drop View */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-3 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-[#E8873A] bg-[#FCEDDE]/50 scale-[0.99]'
                  : 'border-[#1F4D3A]/40 bg-[#FAF6EE] hover:border-[#1F4D3A] hover:bg-[#F5EFE0]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-2xl bg-[#FFFDF8] border-2 border-[#1F4D3A] shadow-[3px_3px_0px_#1F4D3A] flex items-center justify-center mb-3">
                <Upload className="w-7 h-7 text-[#E8873A]" strokeWidth={2.25} />
              </div>

              <h4 className="font-serif font-bold text-sm text-[#1F4D3A] mb-1">
                Choose a photo or drag it here
              </h4>
              <p className="text-xs text-gray-500 font-sans max-w-xs mb-3">
                Supports PNG, JPG, or WEBP up to 5MB. You can position, zoom, and crop into a circular avatar.
              </p>

              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-[#1F4D3A] text-white text-xs font-bold font-sans border-2 border-[#133326] shadow-[2px_2px_0px_#133326] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Select from Computer</span>
              </button>
            </div>
          ) : (
            /* Interactive Canvas Cropper View */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-5 justify-center">
                {/* Canvas with Crop Mask */}
                <div
                  className="relative w-[240px] h-[240px] rounded-2xl overflow-hidden border-3 border-[#1F4D3A] shadow-[4px_4px_0px_#1F4D3A] bg-[#1a1a1a] cursor-grab active:cursor-grabbing shrink-0"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <canvas
                    ref={canvasRef}
                    width={240}
                    height={240}
                    className="w-full h-full block"
                  />

                  {/* Circular Cutout Scrim */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-full"
                    style={{
                      boxShadow: '0 0 0 9999px rgba(15, 33, 25, 0.65)',
                      border: '2.5px solid #E8873A',
                    }}
                  />

                  {/* Center Crosshairs */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                    <div className="w-4 h-[1px] bg-white" />
                    <div className="h-4 w-[1px] bg-white absolute" />
                  </div>
                </div>

                {/* Live Preview Column */}
                <div className="flex sm:flex-col items-center gap-3">
                  <div className="text-center">
                    <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block mb-1.5">
                      Live Preview
                    </span>
                    <div className="w-18 h-18 rounded-full border-3 border-[#1F4D3A] shadow-[3px_3px_0px_#1F4D3A] overflow-hidden bg-[#F5EFE0] mx-auto flex items-center justify-center">
                      {previewDataUrl ? (
                        <img
                          src={previewDataUrl}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-sm text-[#1F4D3A]">{initials}</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#1F4D3A] border-2 border-[#1F4D3A] bg-[#FFFDF8] shadow-[1.5px_1.5px_0px_#1F4D3A] hover:-translate-y-0.5 transition-all cursor-pointer font-sans"
                  >
                    Change Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Slider & Pan Instructions */}
              <div className="p-3 rounded-xl bg-[#FAF6EE] border-2 border-[#DED2B4] flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1F4D3A]">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-[#E8873A]" />
                    <span>Zoom Level:</span>
                  </span>
                  <span>{zoom.toFixed(2)}x</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                    className="p-1 rounded-md border border-[#1F4D3A] bg-[#FFFDF8] hover:bg-gray-100 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-[#1F4D3A]" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-[#E8873A] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                    className="p-1 rounded-md border border-[#1F4D3A] bg-[#FFFDF8] hover:bg-gray-100 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-[#1F4D3A]" />
                  </button>
                </div>

                {/* Transform Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-[#DED2B4]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold font-sans border border-[#1F4D3A] bg-[#FFFDF8] shadow-[1px_1px_0px_#1F4D3A] flex items-center gap-1 text-[#1F4D3A] hover:bg-gray-50 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Rotate 90°</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold font-sans border border-[#1F4D3A] bg-[#FFFDF8] shadow-[1px_1px_0px_#1F4D3A] flex items-center gap-1 text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 italic">
                    Drag canvas to position
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t-2 border-[#DED2B4] bg-[#F5EFE0]/40 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            {currentAvatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#A4432A] border-2 border-[#A4432A] bg-[#FDF2E9] hover:bg-[#FBEAE3] transition-all cursor-pointer flex items-center gap-1.5 font-sans"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Photo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-700 border-2 border-[#1F4D3A] bg-[#FFFDF8] shadow-[2px_2px_0px_#1F4D3A] hover:-translate-y-0.5 transition-all cursor-pointer font-sans"
            >
              Cancel
            </button>

            {imageSrc && (
              <button
                type="button"
                onClick={handleSaveCrop}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white border-2 border-[#133326] shadow-[2.5px_2.5px_0px_#133326] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                style={{
                  background: `linear-gradient(135deg, ${accent}, #1F4D3A)`,
                }}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Save Cropped Avatar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvatarCropperModal;
