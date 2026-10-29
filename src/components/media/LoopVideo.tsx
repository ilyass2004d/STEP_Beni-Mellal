import { useEffect, useRef, useState } from 'react';
import { posterFor } from '../../content/media';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Props {
  src: string;
  label: string;
  /** Play only while true (e.g. chapter active / element on screen). */
  active: boolean;
  /** Start fetching the file (keep false until the section is near). */
  load: boolean;
  playbackRate?: number;
  className?: string;
}

/**
 * Muted, looping background clip. Shows its poster until playable, falls back
 * to the poster on error, never autoplays under prefers-reduced-motion and
 * pauses whenever it is not active.
 */
export function LoopVideo({ src, label, active, load, playbackRate = 1, className = '' }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const poster = posterFor(src);

  useEffect(() => {
    const v = ref.current;
    if (!v || failed) return;
    v.playbackRate = playbackRate;
    if (active && load && !reduced) {
      v.play().catch(() => undefined); // autoplay refused: the poster stays visible
    } else {
      v.pause();
    }
  }, [active, load, reduced, failed, playbackRate]);

  return (
    <div className={`loop-video ${ready ? 'is-ready' : ''} ${className}`} role="img" aria-label={label}>
      <img className="loop-video__poster" src={poster} alt="" aria-hidden="true" decoding="async" />
      {!failed && load && (
        <video
          ref={ref}
          className="loop-video__video"
          src={src}
          muted
          loop
          playsInline
          preload={active ? 'auto' : 'metadata'}
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
