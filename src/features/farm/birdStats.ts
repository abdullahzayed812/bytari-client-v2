import type { FarmBirdStats } from './components';
import type { PoultryFlock } from './types';

/** Birds currently on the farm: remaining (after recorded deaths) in ACTIVE batches only. */
export function birdStats(flocks: PoultryFlock[]): FarmBirdStats {
  const s: FarmBirdStats = { total: 0, chicken: 0, turkey: 0, duck: 0, other: 0 };
  for (const f of flocks) {
    if (f.status !== 'ACTIVE') continue;
    const birds = f.currentBirdCount;
    s.total += birds;
    if (f.birdType === 'CHICKEN') s.chicken += birds;
    else if (f.birdType === 'TURKEY') s.turkey += birds;
    else if (f.birdType === 'DUCK') s.duck += birds;
    else s.other += birds;
  }
  return s;
}
