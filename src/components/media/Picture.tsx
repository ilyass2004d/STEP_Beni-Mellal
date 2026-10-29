import { useState } from 'react';
import { KIND_LABEL, useMediaSrc } from '../../content/media';
import type { MediaRef } from '../../content/types';

interface Props {
  media: MediaRef;
  sizes?: string;
  className?: string;
  eager?: boolean;
}

/** Responsive image with a graceful placeholder when the file is missing. */
export function Picture({ media, sizes = '100vw', className = '', eager = false }: Props) {
  const resolved = useMediaSrc(media.src);
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return (
      <div className={`picture picture--missing ${className}`} role="img" aria-label={media.alt}>
        <span>{resolved ? 'Image indisponible' : 'Chargement…'}</span>
        <code>{media.src}</code>
      </div>
    );
  }
  return (
    <img
      className={`picture ${className}`}
      src={resolved.src}
      srcSet={resolved.srcSet}
      sizes={resolved.srcSet ? sizes : undefined}
      alt={media.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function KindBadge({ kind }: { kind: MediaRef['kind'] }) {
  return <span className={`kind-badge kind-badge--${kind}`}>{KIND_LABEL[kind]}</span>;
}
