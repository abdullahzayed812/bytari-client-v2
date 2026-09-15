import { OrganizationRegistrationScreen } from '@/features/organizations/screens';

/** Route: /(app)/organizations/register-office — "تسجيل المكتب". */
export default function RegisterOfficeRoute() {
  return <OrganizationRegistrationScreen orgType="VETERINARY_OFFICE" />;
}
