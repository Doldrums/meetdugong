import { useOverlayStore, type CardOverlayData } from '../../stores/overlayStore';

export default function CardOverlay() {
  const cards = useOverlayStore((s) => s.cards);

  if (cards.size === 0) return null;

  return (
    <>
      {Array.from(cards.values()).map((card) => (
        <Card key={card.id} card={card} />
      ))}
    </>
  );
}

function Card({ card }: { card: CardOverlayData }) {
  const isRight = card.position !== 'left';

  return (
    <div
      className={`absolute top-[10%] ${isRight ? 'right-[5%]' : 'left-[5%]'} w-[35%] max-w-64`}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden">
        {card.imageUrl && (
          <img
            src={card.imageUrl}
            alt={card.title}
            className="w-full h-32 object-cover"
          />
        )}
        <div className="p-3 space-y-1">
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{card.title}</h3>
          {card.subtitle && (
            <p className="text-gray-600 text-xs">{card.subtitle}</p>
          )}
          {card.price && (
            <p className="text-lg font-bold text-green-700">{card.price}</p>
          )}
          {card.cta && (
            <p className="text-xs text-blue-600 font-medium">{card.cta}</p>
          )}
        </div>
      </div>
    </div>
  );
}
