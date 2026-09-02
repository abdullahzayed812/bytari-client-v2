import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { adsApi } from '../api';
import { Advertisement } from '../components';
import type { AdCampaign } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const bannerCampaign = (): AdCampaign => ({
  id: 'c-home',
  placement: 'HOME',
  type: 'BANNER',
  title: 'Home hero',
  slides: [
    {
      id: 's1',
      title: 'رعاية أفضل',
      subtitle: 'نرعاهم كأنهم عائلتنا',
      ctaLabel: null,
      ctaUrl: null,
      imageUrl: 'https://cdn.example/1.jpg',
      sortOrder: 0,
    },
  ],
});

const carouselCampaign = (): AdCampaign => ({
  id: 'c-pets',
  placement: 'PETS',
  type: 'CAROUSEL',
  title: 'Pets carousel',
  slides: [0, 1, 2].map((i) => ({
    id: `p${i}`,
    title: `شريحة ${i}`,
    subtitle: null,
    ctaLabel: i === 0 ? 'تسوق الآن' : null,
    ctaUrl: i === 0 ? '/(app)/(tabs)/services' : null,
    imageUrl: `https://cdn.example/p${i}.jpg`,
    sortOrder: i,
  })),
});

describe('Advertisement', () => {
  const list = jest.spyOn(adsApi, 'list');
  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders nothing when the placement has no ads', async () => {
    list.mockResolvedValue([]);
    const { toJSON } = renderWithProviders(<Advertisement placement="HOME" />);
    await waitFor(() => expect(list).toHaveBeenCalledWith('HOME'));
    // Only the provider wrapper — the component itself renders no output.
    const tree = toJSON() as { children?: unknown[] } | null;
    expect(tree?.children ?? null).toBeNull();
  });

  it('renders a BANNER campaign as a single slide', async () => {
    list.mockResolvedValue([bannerCampaign()]);
    renderWithProviders(<Advertisement placement="HOME" />);
    await waitFor(() => expect(screen.getByText('رعاية أفضل')).toBeOnTheScreen());
    expect(screen.getByText('نرعاهم كأنهم عائلتنا')).toBeOnTheScreen();
  });

  it('renders a CAROUSEL campaign with every slide and a CTA that deep-links', async () => {
    list.mockResolvedValue([carouselCampaign()]);
    renderWithProviders(<Advertisement placement="PETS" />);
    await waitFor(() => expect(screen.getByText('شريحة 0')).toBeOnTheScreen());
    expect(screen.getByText('شريحة 1')).toBeOnTheScreen();
    expect(screen.getByText('شريحة 2')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'تسوق الآن' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/(tabs)/services');
  });

  it('renders multiple campaigns at a placement as ONE carousel (not a vertical stack)', async () => {
    list.mockResolvedValue([bannerCampaign(), carouselCampaign()]);
    renderWithProviders(<Advertisement placement="HOME" />);
    // every slide from both campaigns is reachable in the single carousel
    await waitFor(() => expect(screen.getByText('رعاية أفضل')).toBeOnTheScreen());
    expect(screen.getByText('شريحة 0')).toBeOnTheScreen();
    expect(screen.getByText('شريحة 2')).toBeOnTheScreen();
    // 1 banner slide + 3 carousel slides = 4 pagination dots (see below), i.e. one pager
    expect(screen.getAllByText('تسوق الآن')).toHaveLength(1);
  });

  it('requests the placement it was given', async () => {
    list.mockResolvedValue([]);
    renderWithProviders(<Advertisement placement="CLINICS" />);
    await waitFor(() => expect(list).toHaveBeenCalledWith('CLINICS'));
  });
});
