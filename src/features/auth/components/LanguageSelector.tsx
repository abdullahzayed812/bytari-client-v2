import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { BottomSheet } from '@/components/overlays';
import { Text } from '@/components/typography';
import { LANGUAGE_OPTIONS, languageLabelKey, setLanguage as applyI18nLanguage } from '@/i18n';
import { usePreferencesStore, type AppLanguage } from '@/store';
import { useTheme } from '@/theme';

/**
 * "اللغة" control of the signed-out screens (welcome / sign-in): shows the
 * current language and opens a list of every supported language — each in
 * its own script — instead of cycling through them on each tap. Selecting one
 * goes through the same path as Settings: the persisted preference + i18n
 * (`setLanguage`), with the restart hint when the text direction flips.
 */
export function LanguageSelector() {
  const theme = useTheme();
  const { t } = useTranslation('nav');
  const toast = useToast();
  const language = usePreferencesStore((s) => s.language);
  const setLanguagePref = usePreferencesStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);

  const choose = async (next: AppLanguage) => {
    setOpen(false);
    if (next === language) return;
    setLanguagePref(next);
    const { directionChanged } = await applyI18nLanguage(next);
    if (directionChanged) {
      toast.show({ message: t('more.languageRestart'), tone: 'info', durationMs: 6000 });
    }
  };

  return (
    <>
      <Pressable
        testID="language-selector"
        accessibilityRole="button"
        accessibilityLabel={`${t('more.language')}: ${t(languageLabelKey(language))}`}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
          pressed && { opacity: 0.6 },
        ]}
      >
        <Icon name="globe-outline" size="iconSm" color="primary" />
        <Text variant="label" color="primary">
          {t(languageLabelKey(language))}
        </Text>
        <Icon name="chevron-down" size="iconXs" color="primary" />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={t('more.language')}>
        <View accessibilityRole="radiogroup" style={{ rowGap: theme.spacing.sm }}>
          {LANGUAGE_OPTIONS.map((o) => {
            const selected = o.value === language;
            return (
              <Pressable
                key={o.value}
                testID={`language-option-${o.value}`}
                accessibilityRole="radio"
                accessibilityState={{ selected, checked: selected }}
                accessibilityLabel={t(o.labelKey)}
                onPress={() => void choose(o.value)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text variant="bodyStrong" color={selected ? 'primary' : 'textPrimary'}>
                  {t(o.labelKey)}
                </Text>
                <Icon
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size="iconSm"
                  color={selected ? 'primary' : 'textMuted'}
                />
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}
