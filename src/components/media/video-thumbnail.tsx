'use client';

import { useEffect, useRef, useState } from 'react';
import { PlayIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

function captureFrame(url: string, signal: AbortSignal): Promise<string> {
  return new Promise(resolve => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    let settled = false;
    let target = 0;
    const finish = (frame = '') => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      video.removeEventListener('loadedmetadata', metadata);
      video.removeEventListener('loadeddata', capture);
      video.removeEventListener('seeked', capture);
      video.removeEventListener('error', abort);
      video.pause();
      video.removeAttribute('src');
      video.load();
      resolve(frame);
    };
    const abort = () => finish();
    const capture = () => {
      if (video.seeking || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;
      // Some formats seek to an earlier keyframe. A decoded frame is still usable.
      try {
        const scale = Math.min(1, 640 / video.videoWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) return finish();
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL('image/jpeg', 0.75));
      } catch {
        finish(); // Unsupported format, CORS or canvas failure: retain a clean fallback.
      }
    };
    const metadata = () => {
      target = Number.isFinite(video.duration) ? Math.min(0.25, video.duration / 10) : 0;
      try { if (target > 0) video.currentTime = target; } catch { target = 0; }
    };
    const timeout = window.setTimeout(abort, 8000);
    signal.addEventListener('abort', abort, { once: true });
    video.addEventListener('loadedmetadata', metadata);
    video.addEventListener('loadeddata', capture);
    video.addEventListener('seeked', capture);
    video.addEventListener('error', abort);
    if (signal.aborted) return finish();
    video.src = url;
    video.load();
  });
}

interface VideoThumbnailProps {
  url: string;
  thumbnailUrl?: string | null;
  alt: string;
  className?: string;
}

function Thumbnail({ url, thumbnailUrl, alt, className = '' }: VideoThumbnailProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [frame, setFrame] = useState('');
  const [finished, setFinished] = useState(false);
  // Legacy API responses use the original video URL when no thumbnail exists.
  const poster = thumbnailUrl && thumbnailUrl.split('#')[0] !== url.split('#')[0] ? thumbnailUrl : '';

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof window.IntersectionObserver !== 'function') {
      const timer = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(timer);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || (poster && !posterFailed)) return;
    const controller = new AbortController();
    void captureFrame(url, controller.signal).then(result => {
      if (!controller.signal.aborted) { setFrame(result); setFinished(true); }
    });
    return () => controller.abort();
  }, [url, visible, poster, posterFailed]);

  const src = poster && !posterFailed ? poster : frame;
  return (
    <span ref={ref} className={`relative block h-full w-full overflow-hidden bg-slate-200 dark:bg-slate-800 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => {
          if (poster && !posterFailed) setPosterFailed(true);
          else { setFrame(''); setFinished(true); }
        }} />
      ) : (
        <span role="img" aria-label={alt} className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center text-slate-600 dark:text-slate-300">
          <VideoCameraIcon className="h-8 w-8" aria-hidden="true" />
          <span className="text-xs">{finished ? 'Preview unavailable' : 'Video'}</span>
        </span>
      )}
      {src && <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="rounded-full bg-black/60 p-2"><PlayIcon className="h-5 w-5 text-white" /></span>
      </span>}
    </span>
  );
}

export default function VideoThumbnail(props: VideoThumbnailProps) {
  return <Thumbnail key={`${props.url}\u0000${props.thumbnailUrl || ''}`} {...props} />;
}
