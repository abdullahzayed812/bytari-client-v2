import { View } from 'react-native';

import { Card } from '@/components/content';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { useCapabilities } from '@/hooks';

/**
 * Control Centre landing — placeholder. Lists the areas the internal dashboard
 * will cover; each becomes a real screen in a later phase. Visibility already
 * follows the user's permissions/supervisor domains for UX.
 */
export default function ControlCentreHome() {
  const caps = useCapabilities();

  const areas = [
    { key: 'users', label: 'المستخدمون والأدوار', show: caps.isAdmin || caps.can('user.read') },
    {
      key: 'vets',
      label: 'اعتماد الأطباء',
      show: caps.isAdmin || caps.can('veterinarian.application.read'),
    },
    { key: 'orgs', label: 'المؤسسات', show: caps.isAdmin || caps.can('organization.admin.read') },
    { key: 'supervisors', label: 'المشرفون', show: caps.isAdmin || caps.can('supervisor.read') },
    { key: 'audit', label: 'سجل التدقيق', show: caps.isAdmin || caps.can('audit.read') },
    { key: 'content', label: 'إدارة المحتوى', show: caps.isSupervisorOf('CONTENT') },
  ].filter((a) => a.show);

  return (
    <ScrollScreen>
      <AppHeader title="مركز التحكم" showBack />
      <Section spacing="lg">
        <Caption>الوصول مبني على صلاحياتك الحالية من الخادم.</Caption>
      </Section>
      <View style={{ rowGap: 12 }}>
        {areas.map((area) => (
          <Card key={area.key} variant="outlined">
            <Text variant="bodyMedium">{area.label}</Text>
            <Caption>قيد الإنشاء — مرحلة لاحقة</Caption>
          </Card>
        ))}
      </View>
    </ScrollScreen>
  );
}
