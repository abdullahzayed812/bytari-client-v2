import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Modal } from '@/components/overlays';
import { Label } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useSubmitOrganizationReview } from '../hooks';

import { RatingStars } from './RatingStars';

export interface ReviewModalProps {
  organizationId: string;
  visible: boolean;
  onClose: () => void;
  /** The viewer's existing review — pre-fills the form (one review per user; submit updates it). */
  initial?: { rating: number; comment: string | null } | null;
}

/** "تقييم" — submit (or update) the viewer's own rating + optional comment. */
export function ReviewModal({ organizationId, visible, onClose, initial }: ReviewModalProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const mutation = useSubmitOrganizationReview(organizationId);

  const reset = () => {
    setRating(0);
    setComment('');
  };

  useEffect(() => {
    if (!visible) return;
    setRating(initial?.rating ?? 0);
    setComment(initial?.comment ?? '');
  }, [visible, initial]);

  const submit = () => {
    if (rating < 1) return;
    mutation.mutate(
      { rating, comment: comment.trim() || null },
      {
        onSuccess: () => {
          toast.show({ message: t('clinicDetail.reviewSuccess'), tone: 'success' });
          reset();
          onClose();
        },
        onError: (error) => {
          toast.show({ message: apiErrorMessage(error), tone: 'danger' });
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={() => {
        reset();
        onClose();
      }}
      title={initial ? t('clinicDetail.reviewModalEditTitle') : t('clinicDetail.reviewModalTitle')}
    >
      <View style={{ rowGap: theme.spacing.lg }}>
        <View style={{ alignItems: 'center', rowGap: theme.spacing.sm }}>
          <Label>{t('clinicDetail.reviewRatingLabel')}</Label>
          <RatingStars
            value={rating}
            size="lg"
            onChange={setRating}
            accessibilityLabel={t('clinicDetail.reviewRatingLabel')}
          />
        </View>
        <Input
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
          placeholder={t('clinicDetail.reviewCommentPlaceholder')}
        />
        <Button
          label={t('clinicDetail.reviewSubmit')}
          onPress={submit}
          loading={mutation.isPending}
          disabled={rating < 1}
          fullWidth
        />
      </View>
    </Modal>
  );
}
