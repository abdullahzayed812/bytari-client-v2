/**
 * Advertisements feature — one reusable, placement-driven ad system. A screen
 * declares only its placement (`<Advertisement placement="PETS" />`); the
 * backend (`GET /ads?placement=…`) decides what renders (single banner vs.
 * carousel) and the content of every slide. No hard-coded banners in screens.
 */
export { Advertisement } from './components';
export { useAds } from './hooks';
export { adsApi, adKeys, type AdsApi } from './api';
export {
  AD_PLACEMENTS,
  type AdPlacement,
  type AdType,
  type AdSlide,
  type AdCampaign,
} from './types';
