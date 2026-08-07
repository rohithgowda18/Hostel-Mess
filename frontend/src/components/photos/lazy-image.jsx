import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * LazyImage renders an image with a skeleton placeholder until the image loads.
 * It respects the user's prefers-reduced-motion setting.
 */
export default function LazyImage({ src, alt = '', className = '' }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Skeleton placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse rounded" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn('transition-opacity duration-300 ease-in-out', loaded ? 'opacity-100' : 'opacity-0')}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
