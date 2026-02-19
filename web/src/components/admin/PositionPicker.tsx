import type { OverlaySlot } from '@shared/overlayPositions';

const GRID: { slot: OverlaySlot; label: string; row: number; col: number }[] = [
  { slot: 'top-left',      label: 'TL', row: 0, col: 0 },
  { slot: 'top-center',    label: 'TC', row: 0, col: 1 },
  { slot: 'top-right',     label: 'TR', row: 0, col: 2 },
  { slot: 'middle-left',   label: 'ML', row: 1, col: 0 },
  // middle-center is the character zone — not selectable
  { slot: 'middle-right',  label: 'MR', row: 1, col: 2 },
  { slot: 'bottom-left',   label: 'BL', row: 2, col: 0 },
  { slot: 'bottom-center', label: 'BC', row: 2, col: 1 },
  { slot: 'bottom-right',  label: 'BR', row: 2, col: 2 },
];

interface PositionPickerProps {
  value: OverlaySlot;
  onChange: (slot: OverlaySlot) => void;
}

export default function PositionPicker({ value, onChange }: PositionPickerProps) {
  return (
    <div
      className="grid grid-cols-3 grid-rows-3 gap-px rounded-md overflow-hidden border border-white/10"
      style={{ width: 48, height: 72 }}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const cell = GRID.find((g) => g.row === row && g.col === col);

        if (!cell) {
          // Character zone (middle-center)
          return (
            <div
              key={i}
              className="bg-white/[0.03]"
              title="Character zone"
            />
          );
        }

        const active = value === cell.slot;
        return (
          <button
            key={cell.slot}
            type="button"
            onClick={() => onChange(cell.slot)}
            title={cell.slot}
            className={`transition-colors duration-150 cursor-pointer ${
              active
                ? 'bg-[#007AFF] hover:bg-[#0070E0]'
                : 'bg-white/[0.06] hover:bg-white/[0.12]'
            }`}
          />
        );
      })}
    </div>
  );
}
