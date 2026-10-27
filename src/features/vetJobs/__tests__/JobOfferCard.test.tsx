import { renderWithProviders, screen } from '@/test-utils/render';

import { JobOfferCard } from '../components';
import type { PublicVetJobOffer } from '../types';

const offer = (over: Partial<PublicVetJobOffer> = {}): PublicVetJobOffer => ({
  id: 'j1',
  organizationName: 'عيادة الرحمة',
  imageUrl: null,
  title: 'طبيب بيطري',
  employmentType: 'FULL_TIME',
  governorate: 'بغداد',
  district: null,
  salaryAmount: null,
  salaryNegotiable: true,
  experienceYearsRequired: null,
  qualifications: null,
  description: '',
  responsibilities: [],
  requirements: [],
  benefits: [],
  contactPhone: '0770',
  contactEmail: null,
  applicationDeadline: null,
  publishedAt: '',
  ...over,
});

describe('JobOfferCard — offer image with fallback', () => {
  it.each(['list', 'grid'] as const)(
    '%s: shows the offer image when the API returns one',
    (variant) => {
      const { UNSAFE_root } = renderWithProviders(
        <JobOfferCard
          offer={offer({ imageUrl: 'https://cdn/x.png' })}
          onPress={() => {}}
          variant={variant}
        />,
      );
      const images = UNSAFE_root.findAll(
        (n: { props: unknown }) =>
          (n.props as { source?: { uri?: string } }).source?.uri === 'https://cdn/x.png',
      );
      expect(images.length).toBeGreaterThan(0);
      expect(screen.getByText('طبيب بيطري')).toBeOnTheScreen();
    },
  );

  it.each(['list', 'grid'] as const)('%s: no image → no broken image, icon fallback', (variant) => {
    const { UNSAFE_root } = renderWithProviders(
      <JobOfferCard offer={offer()} onPress={() => {}} variant={variant} />,
    );
    expect(
      UNSAFE_root.findAll((n: { props: unknown }) =>
        Boolean((n.props as { source?: unknown }).source),
      ),
    ).toHaveLength(0);
  });
});
