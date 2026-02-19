import { useState, useCallback, useRef } from 'react';

interface VideoExportReturn {
  startRecording: () => boolean;
  stopRecording: () => void;
  isRecording: boolean;
}

/**
 * Draw visible overlay elements from the iframe DOM onto the recording canvas.
 * Uses data attributes for reliable element selection, then traverses visible
 * children to composite glass panels, text, and images.
 */
function paintOverlays(
  ctx: CanvasRenderingContext2D,
  iframeDoc: Document,
  cw: number,
  ch: number,
) {
  const overlayLayer = iframeDoc.querySelector('[data-overlay-layer]') as HTMLElement | null;
  if (!overlayLayer) return;

  const container = iframeDoc.querySelector('[data-player-container]') as HTMLElement | null;
  if (!container) return;

  const cr = container.getBoundingClientRect();
  if (cr.width === 0 || cr.height === 0) return;

  const sx = cw / cr.width;
  const sy = ch / cr.height;

  // Walk all descendant elements in the overlay layer
  const allEls = overlayLayer.querySelectorAll<HTMLElement>('*');
  for (const el of allEls) {
    paintSingleElement(ctx, el, cr, sx, sy);
  }
}

function paintSingleElement(
  ctx: CanvasRenderingContext2D,
  el: HTMLElement,
  containerRect: DOMRect,
  sx: number,
  sy: number,
) {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return;
  if (parseFloat(style.opacity) < 0.05) return;

  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;

  const x = (rect.left - containerRect.left) * sx;
  const y = (rect.top - containerRect.top) * sy;
  const w = rect.width * sx;
  const h = rect.height * sy;

  // Draw glass-style background for elements that have backdrop-filter
  const hasBackdrop = style.backdropFilter !== 'none' && style.backdropFilter !== '';
  if (hasBackdrop) {
    const borderRadius = parseFloat(style.borderRadius) * sx || 0;
    const r = Math.min(borderRadius, w / 2, h / 2);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(15, 20, 45, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = Math.max(1, 1 * sx);
    ctx.stroke();
    ctx.restore();
  }

  // Draw text if this element directly contains text nodes
  const directText = getDirectText(el);
  if (directText.trim()) {
    ctx.save();
    const fontSize = parseFloat(style.fontSize) * sx;
    const fw = style.fontWeight;
    ctx.font = `${fw} ${Math.max(10, fontSize)}px -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
    ctx.fillStyle = style.color || 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6 * sx;
    ctx.shadowOffsetY = 1 * sy;

    const align = style.textAlign;
    const lines = directText.split('\n').filter(l => l.trim());
    const lineH = fontSize * 1.4;

    if (align === 'center') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const totalH = lines.length * lineH;
      const startY = y + (h - totalH) / 2 + lineH / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), x + w / 2, startY + i * lineH, w * 0.95);
      }
    } else {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const px = parseFloat(style.paddingLeft) * sx || 4 * sx;
      const py = parseFloat(style.paddingTop) * sy || 2 * sy;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), x + px, y + py + i * lineH, w - px * 2);
      }
    }
    ctx.restore();
  }

  // Draw <img> elements (QR codes, card images)
  if (el.tagName === 'IMG') {
    const img = el as HTMLImageElement;
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      const borderRadius = parseFloat(style.borderRadius) * sx || 0;
      if (borderRadius > 2) {
        ctx.beginPath();
        roundRect(ctx, x, y, w, h, Math.min(borderRadius, w / 2, h / 2));
        ctx.clip();
      }
      try {
        ctx.drawImage(img, x, y, w, h);
      } catch {
        // Cross-origin images can't be drawn — skip
      }
      ctx.restore();
    }
  }
}

/** Get text directly owned by this element (not from child elements) */
function getDirectText(el: HTMLElement): string {
  let text = '';
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
    }
  }
  return text;
}

/** Draw a rounded rectangle path */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function useVideoExport(): VideoExportReturn {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);

  const stopRecording = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback((): boolean => {
    try {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Player Preview"]');
      if (!iframe?.contentDocument) {
        console.warn('[video-export] Cannot access iframe — not same-origin');
        return false;
      }

      const videos = iframe.contentDocument.querySelectorAll('video');
      if (videos.length === 0) {
        console.warn('[video-export] No video elements found in player');
        return false;
      }

      // Fixed 9:16 portrait output
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d')!;

      chunksRef.current = [];

      const paintFrame = () => {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) {
          rafRef.current = requestAnimationFrame(paintFrame);
          return;
        }

        const allVideos = iframeDoc.querySelectorAll('video');
        let activeVideo: HTMLVideoElement | null = null;
        for (const v of allVideos) {
          if (!v.paused && v.readyState >= 2) {
            activeVideo = v;
            break;
          }
        }
        if (!activeVideo) {
          activeVideo = allVideos[0] ?? null;
        }

        // Clear frame
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (activeVideo && activeVideo.videoWidth > 0 && activeVideo.videoHeight > 0) {
          // Draw video with object-cover behavior into 9:16 canvas
          const vw = activeVideo.videoWidth;
          const vh = activeVideo.videoHeight;
          const canvasRatio = canvas.width / canvas.height; // 9/16
          const videoRatio = vw / vh;

          let sx = 0, sy = 0, sw = vw, sh = vh;
          if (videoRatio > canvasRatio) {
            // Video is wider — crop sides
            sw = vh * canvasRatio;
            sx = (vw - sw) / 2;
          } else {
            // Video is taller — crop top/bottom
            sh = vw / canvasRatio;
            sy = (vh - sh) / 2;
          }
          ctx.drawImage(activeVideo, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        }

        // Composite overlay elements on top
        paintOverlays(ctx, iframeDoc, canvas.width, canvas.height);

        rafRef.current = requestAnimationFrame(paintFrame);
      };

      // Prefer MP4 (H.264), fall back to WebM
      const stream = canvas.captureStream(30);
      const mp4Types = [
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4;codecs=avc1',
        'video/mp4',
      ];
      const webmTypes = [
        'video/webm;codecs=vp9',
        'video/webm',
      ];
      const mimeType = [...mp4Types, ...webmTypes].find(t => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
      const isMp4 = mimeType.startsWith('video/mp4');

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scenario-${Date.now()}.${isMp4 ? 'mp4' : 'webm'}`;
        a.click();
        URL.revokeObjectURL(url);
        chunksRef.current = [];
      };

      recorderRef.current = recorder;
      recorder.start(100);
      paintFrame();
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('[video-export] Failed to start recording:', err);
      return false;
    }
  }, []);

  return { startRecording, stopRecording, isRecording };
}
