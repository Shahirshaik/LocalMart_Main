"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function FallbackImage({ src, alt, className, fallback }: Props) {
  const [error, setError] = useState(false);

  if (error && fallback) return <>{fallback}</>;

  return (
    <img
      src={error ? "/placeholder-image.svg" : src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
