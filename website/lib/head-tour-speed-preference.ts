import {HEAD_TOUR_SPEEDS, type HeadTourSpeed} from './head-tour-playback.ts';

export const HEAD_TOUR_SPEED_PREFERENCE_KEY = 'visible-medicine:head-tour-speed';

type SpeedStorage = Pick<Storage, 'getItem' | 'setItem'>;
type StorageAccess = () => SpeedStorage | null | undefined;

/** Only the manually selected playback speed is retained. Storage is optional. */
export function readHeadTourSpeedPreference(storage: StorageAccess): HeadTourSpeed | null {
  try {
    const value = storage()?.getItem(HEAD_TOUR_SPEED_PREFERENCE_KEY);
    return HEAD_TOUR_SPEEDS.find(speed => String(speed) === value) ?? null;
  } catch {
    return null;
  }
}

export function writeHeadTourSpeedPreference(storage: StorageAccess, speed: number): boolean {
  if (!HEAD_TOUR_SPEEDS.some(allowed => allowed === speed)) return false;
  try {
    const target = storage();
    if (!target) return false;
    target.setItem(HEAD_TOUR_SPEED_PREFERENCE_KEY, String(speed));
    return true;
  } catch {
    return false;
  }
}
