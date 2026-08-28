import { Link, Stack } from 'expo-router';

import { TextButton } from '@/components/actions';
import { EmptyState } from '@/components/feedback';
import { Screen } from '@/components/layout';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <EmptyState
          icon="help-circle-outline"
          title="الصفحة غير موجودة"
          message="تعذّر العثور على هذه الوجهة."
        />
        <Link href="/" asChild>
          <TextButton label="العودة إلى الرئيسية" icon="home-outline" />
        </Link>
      </Screen>
    </>
  );
}
