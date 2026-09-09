import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { TextButton } from '@/components/actions';
import { Checkbox } from '@/components/forms';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { VET_SERVICE_TERMS, type VetServiceTermsKey } from '../data/vetServicesTerms';

export interface TermsAcceptFieldProps {
  termsKey: VetServiceTermsKey;
  accepted: boolean;
  onChange: (next: boolean) => void;
}

/**
 * "أوافق على الشروط والأحكام" — the checkbox + a link that opens the relevant
 * terms in a Modal. UI-only: nothing is persisted server-side; the calling
 * screen keeps its submit button disabled until `accepted` is true.
 */
export function TermsAcceptField({ termsKey, accepted, onChange }: TermsAcceptFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const doc = VET_SERVICE_TERMS[termsKey];

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Checkbox
            label="أوافق على الشروط والأحكام"
            checked={accepted}
            onChange={onChange}
          />
        </View>
        <TextButton label="عرض الشروط" onPress={() => setOpen(true)} />
      </View>

      <Modal visible={open} onClose={() => setOpen(false)} title={doc.title}>
        <Caption color="textSecondary">{doc.intro}</Caption>
        <ScrollView
          style={{ maxHeight: 380 }}
          contentContainerStyle={{ rowGap: theme.spacing.md, paddingVertical: theme.spacing.sm }}
          showsVerticalScrollIndicator
        >
          {doc.clauses.map((clause, i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', columnGap: theme.spacing.sm, alignItems: 'flex-start' }}
            >
              <Text variant="label" style={{ minWidth: 22, textAlign: 'left', color: theme.colors.serviceAccent }}>
                {i + 1}.
              </Text>
              <Text style={{ flex: 1 }}>{clause}</Text>
            </View>
          ))}
        </ScrollView>
      </Modal>
    </View>
  );
}
