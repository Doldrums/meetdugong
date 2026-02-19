import type { OverlaySlot } from '@shared/overlayPositions';
import { ALL_SLOTS } from '@shared/overlayPositions';

const GRID: { slot: OverlaySlot; label: string; row: number; col: number }[] = [
  { slot: 'left-top',      label: 'LT', row: 0, col: 0 },
  { slot: 'right-top',     label: 'RT', row: 0, col: 2 },
  { slot: 'left-mid',      label: 'LM', row: 1, col: 0 },
  { slot: 'right-mid',     label: 'RM', row: 1, col: 2 },
  { slot: 'bottom',        label: 'B',  row: 2, col: 0 },
];

interface PositionPickerProps {
  value: OverlaySlot;
  onChange: (slot: OverlaySlot) => void;
}

/** Visual grid for picking overlay zones. Currently unused (positions are auto-assigned). */
export default function PositionPicker({ value, onChange }: PositionPickerProps) {
  return (
    <div className="flex gap-1">
      {ALL_SLOTS.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          title={slot}
          className={`w-5 h-5 rounded text-[8px] font-bold transition-colors duration-150 cursor-pointer ${
            value === slot
              ? 'bg-[#007AFF] text-white'
              : 'bg-white/[0.06] text-white/30 hover:bg-white/[0.12]'
          }`}
        >
          {GRID.find((g) => g.slot === slot)?.label ?? '?'}
        </button>
      ))}
    </div>
  );
}
