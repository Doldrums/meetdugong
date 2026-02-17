import { useVideoSwitch } from '../../hooks/useVideoSwitch';

interface VideoLayerProps {
  clips: string[];
  onClipStarted?: (clip: string) => void;
  onClipEnded?: (clip: string) => void;
  onVideoSwitch?: ReturnType<typeof useVideoSwitch>;
}

export default function VideoLayer({ clips, onClipStarted, onClipEnded, onVideoSwitch }: VideoLayerProps) {
  const internal = useVideoSwitch({ clips, onClipStarted, onClipEnded });
  const vs = onVideoSwitch ?? internal;

  const handleError = (slot: 'A' | 'B') => {
    const el = slot === 'A' ? vs.videoARef.current : vs.videoBRef.current;
    console.error(`[video] error on slot ${slot}:`, el?.error?.message);
    vs.handleEnded(slot);
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={vs.videoARef}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ zIndex: 2 }}
        muted
        playsInline
        onEnded={() => vs.handleEnded('A')}
        onTimeUpdate={() => vs.handleTimeUpdate('A')}
        onError={() => handleError('A')}
      />
      <video
        ref={vs.videoBRef}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ zIndex: 1 }}
        muted
        playsInline
        onEnded={() => vs.handleEnded('B')}
        onTimeUpdate={() => vs.handleTimeUpdate('B')}
        onError={() => handleError('B')}
      />
    </div>
  );
}
