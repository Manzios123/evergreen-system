'use client';

import { forwardRef, useEffect, useRef, useState, type ImgHTMLAttributes, type VideoHTMLAttributes, type AnchorHTMLAttributes } from 'react';
import { useAuth } from '@/contexts/auth-context';

// Login credentials are sent only in a header to our configured API origin.
// Native media elements receive an expiring resource-only URL; video stays streamed.
export function useMediaSource(source?: string | null): string | undefined {
  const { user } = useAuth();
  const [resolved, setResolved] = useState<{ source: string; actor: string; url: string } | null>(null);
  const actor = user?.id || '';
  let target: URL | undefined;
  if (source && typeof window !== 'undefined') {
    try {
      const candidate = new URL(source, window.location.origin);
      const api = new URL(process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin, window.location.origin);
      if (candidate.origin === api.origin && (/^\/api\/(?:media|photos)\//.test(candidate.pathname) || /^\/api\/survey-media\/[^/]+\/download\/?$/.test(candidate.pathname))) target = candidate;
    } catch { /* Invalid source is handled by the media element's fallback. */ }
  }
  const pathname = target?.pathname;
  const origin = target?.origin;
  useEffect(() => {
    if (!source || !pathname || !origin || !actor) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${origin}/api/media/access`, { method: 'POST', signal: controller.signal, credentials: 'omit',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ path: pathname }) });
        if (!response.ok) throw new Error('Media unavailable');
        const data = await response.json();
        const granted = new URL(data.url);
        if (granted.origin !== origin || granted.pathname !== pathname || !Number.isFinite(data.expiresAt) || data.expiresAt <= Date.now()) throw new Error('Invalid media access');
        if (controller.signal.aborted) return;
        setResolved({ source, actor, url: granted.toString() });
        timer = setTimeout(refresh, Math.max(1000, data.expiresAt - Date.now() - 60000));
      } catch {
        if (!controller.signal.aborted) setResolved(null);
      }
    };
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [source, pathname, origin, actor]);
  if (typeof window === 'undefined') return undefined;
  if (!target) return source || undefined;
  if (!resolved) return undefined;
  return resolved.source === source && resolved.actor === actor && actor ? resolved.url : undefined;
}

export function ProtectedImage({ src, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const resolved = useMediaSource(typeof src === 'string' ? src : undefined);
  return resolved ? <img {...props} src={resolved} referrerPolicy="no-referrer" /> : <span role="img" aria-label={props.alt || 'Loading media'} className={props.className} />;
}

export const ProtectedVideo = forwardRef<HTMLVideoElement, VideoHTMLAttributes<HTMLVideoElement>>(function ProtectedVideo({ src, ...props }, ref) {
  const resolved = useMediaSource(typeof src === 'string' ? src : undefined);
  const playback = useRef({ source: src, time: 0, playing: false });
  if (playback.current.source !== src) playback.current = { source: src, time: 0, playing: false };
  return <video {...props} ref={ref} src={resolved}
    onTimeUpdate={event => { playback.current.time = event.currentTarget.currentTime; props.onTimeUpdate?.(event); }}
    onPlay={event => { playback.current.playing = true; props.onPlay?.(event); }}
    onPause={event => { if (event.currentTarget.readyState >= 2) playback.current.playing = false; props.onPause?.(event); }}
    onLoadedMetadata={event => {
      if (playback.current.time > 0) event.currentTarget.currentTime = playback.current.time;
      if (playback.current.playing) void event.currentTarget.play().catch(() => {});
      props.onLoadedMetadata?.(event);
    }} />;
});

export function ProtectedMediaLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const resolved = useMediaSource(href);
  return <a {...props} href={resolved} aria-disabled={!resolved} referrerPolicy="no-referrer" onClick={event => {
    if (!resolved) event.preventDefault(); else props.onClick?.(event);
  }}>{children}</a>;
}
