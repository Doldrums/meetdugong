import { useOverlayStore } from '../../stores/overlayStore';

export default function Subtitle() {
  const text = useOverlayStore((s) => s.subtitleText);

  if (!text) return null;

  return (
    <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 max-w-[80%]">
      <div className="bg-black/70 backdrop-blur-sm text-white text-lg px-6 py-2 rounded-lg text-center leading-snug">
        {text}
      </div>
    </div>
  );
}
