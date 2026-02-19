import { useMemo } from 'react';
import { useOverlayStore } from '../stores/overlayStore';
import type { OverlaySlot } from '@shared/overlayPositions';

/** Returns the set of currently occupied overlay zones. */
export function useOccupiedZones(): ReadonlySet<OverlaySlot> {
  const zoneMap = useOverlayStore((s) => s.zoneMap);
  return useMemo(
    () => new Set([...zoneMap.values()].map((e) => e.zone)),
    [zoneMap],
  );
}
