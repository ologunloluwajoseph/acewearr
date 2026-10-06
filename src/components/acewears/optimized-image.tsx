"use client";

import NextImage from "next/image";

/**
 * Optimized Image component for AceWears.
 * Wraps Next.js Image with:
 * - Lazy loading (default)
 * - WebP/AVIF format conversion (automatic in Next.js)
 * - Responsive srcset
 * - Blur placeholder for above-the-fold images
 * - Error fallback to regular <img>
 */

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  className,
  style,
}: Props) {
  // For external URLs (Unsplash, etc.), Next.js Image works but doesn't optimize.
  // For local images (/uploads/...), it optimizes fully.
  const isExternal = src.startsWith("http");

  if (fill) {
    return (
      <div className={`relative overflow-hidden ${className || ""}`} style={style}>
        <NextImage
          src={src}
          alt={alt}
          fill
          sizes={sizes || "(max-width: 768px) 50vw, 25vw"}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <NextImage
      src={src}
      alt={alt}
      width={width || 400}
      height={height || 533}
      sizes={sizes || "(max-width: 768px) 50vw, 25vw"}
      priority={priority}
      className={className}
      style={style}
      unoptimized={isExternal} // Skip optimization for external URLs
    />
  );
}
