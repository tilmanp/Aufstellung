/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { User } from "lucide-react";

interface ImageWithFallbackProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  isPortrait?: boolean;
  size: number;
}

export function ImageWithFallback({ src, fallbackSrc, alt, isPortrait = false, size }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(!src && !!fallbackSrc);

  const currentSrc = isUsingFallback ? fallbackSrc : src;

  if (!currentSrc || error) {
    return <User size={size} />;
  }

  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      className={`w-full h-full ${isPortrait ? 'object-cover' : 'object-contain'}`}
      referrerPolicy="no-referrer"
      onError={() => {
        if (!isUsingFallback && fallbackSrc) {
          setIsUsingFallback(true);
        } else {
          setError(true);
        }
      }}
    />
  );
}
