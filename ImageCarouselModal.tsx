"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface ImageCarouselModalProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function ImageCarouselModal({ images, isOpen, onClose, initialIndex = 0 }: ImageCarouselModalProps) {
  const [current, setCurrent] = useState(initialIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-oriva-muted hover:text-oriva-cream transition-colors"
        >
          <X size={24} />
        </button>
        <div className="relative aspect-square rounded-xl overflow-hidden bg-oriva-surface">
          <Image
            src={images[current]}
            alt={`Image ${current + 1}`}
            fill
            className="object-contain"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-oriva-gold w-4" : "bg-oriva-border hover:bg-oriva-muted"}`}
            />
          ))}
        </div>
        <p className="text-center text-oriva-muted text-xs mt-2">{current + 1} / {images.length}</p>
      </div>
    </div>
  );
}
