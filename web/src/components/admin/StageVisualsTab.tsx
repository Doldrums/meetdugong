import type { ControlEvent } from '@shared/types';
import VisualGallery from './overlays/VisualGallery';
import OverlayControls from './OverlayControls';

interface StageVisualsTabProps {
  onSend: (event: ControlEvent) => void;
}

export default function StageVisualsTab({ onSend }: StageVisualsTabProps) {
  return (
    <div className="space-y-5">
      <VisualGallery />

      {/* Glass separator */}
      <div
        className="h-px mx-2"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.12), transparent)',
        }}
      />

      <OverlayControls onSend={onSend} />
    </div>
  );
}
