import { OrganizationRegistrationScreen } from '@/features/organizations/screens';

/** Route: /(app)/organizations/register-clinic — "تسجيل العيادة". */
export default function RegisterClinicRoute() {
  return <OrganizationRegistrationScreen orgType="CLINIC" />;
}
