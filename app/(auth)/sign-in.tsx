import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Input, PasswordInput } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { Caption, Heading, Text } from '@/components/typography';
import { useAuth } from '@/hooks';
import { isApiError } from '@/services/api';
import { useTheme } from '@/theme';

/**
 * FOUNDATION PLACEHOLDER — a minimal working sign-in that exercises the API +
 * auth + form + i18n + design-system stack end to end. The full auth experience
 * (register, verification, recovery, vet application) is a later phase.
 */
const schema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});
type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await signIn(values);
      // AuthRedirector handles navigation.
    } catch (error) {
      const message = isApiError(error)
        ? error.isNetworkError
          ? 'تعذّر الوصول إلى الخادم. تحقق من اتصالك.'
          : error.status === 401
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
            : error.message
        : 'حدث خطأ ما. حاول مجدداً.';
      toast.show({ tone: 'danger', message });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <ScrollScreen contentStyle={{ justifyContent: 'center' }}>
      <Section spacing="xxxl">
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: theme.radius.xl,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <Icon name="paw" size="iconXl" color="primary" />
        </View>
        <Heading level={1}>مرحباً بك في بيطري</Heading>
        <Caption>سجّل الدخول للمتابعة</Caption>
      </Section>

      <Section spacing="lg">
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <Input
              label="البريد الإلكتروني"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </Section>

      <Section spacing="xl">
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <PasswordInput
              label="كلمة المرور"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </Section>

      <Button label="تسجيل الدخول" fullWidth loading={submitting} onPress={onSubmit} />

      <Text variant="caption" color="textMuted" center style={{ marginTop: theme.spacing.xl }}>
        هذه شاشة تأسيسية مبدئية — تجربة الحساب الكاملة تأتي في مرحلة لاحقة.
      </Text>
    </ScrollScreen>
  );
}
