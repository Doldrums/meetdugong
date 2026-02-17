import { useOverlayStore } from '../../stores/overlayStore';

export default function QROverlay() {
  const qrUrl = useOverlayStore((s) => s.qrUrl);

  if (!qrUrl) return null;

  // Use a QR code API for quick rendering
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="absolute bottom-[15%] right-[5%]">
      <div className="bg-white rounded-xl p-3 shadow-2xl">
        <img
          src={qrImageUrl}
          alt="QR Code"
          className="w-32 h-32"
        />
        <p className="text-xs text-gray-500 text-center mt-1 max-w-32 truncate">{qrUrl}</p>
      </div>
    </div>
  );
}
