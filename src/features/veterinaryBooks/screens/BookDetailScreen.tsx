import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, SkeletonText, useToast } from '@/components/feedback';
import { ScrollScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import {
  ContentBody,
  useAddContentComment,
  useContentComments,
  useContentFileUrl,
  useContentItem,
  useContentRating,
  useSubmitContentRating,
  useToggleContentBookmark,
  useToggleContentLike,
} from '@/features/content';
import { apiErrorMessage } from '@/lib/apiError';
import { isRTL, physicalRow } from '@/lib/rtl';
import { shareText } from '@/lib/share';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate, initialsOf } from '@/utils';

/** Palette of the "تفاصيل الكتاب" reference. */
const C = {
  brand: '#079653',
  brandDark: '#087A4A',
  light: '#EFFAF4',
  border: '#E1EAE4',
  headerBorder: '#E3EDE7',
  soft: '#F8FAF9',
  gold: '#F6B81A',
  divider: '#F0F5F2',
};

/**
 * Route `/veterinary-books/[bookId]` — "تفاصيل الكتاب", laid out after the
 * reference: share / favourite / back round buttons, the cover beside the
 * title, author and rating, «قراءة الكتاب» / «تحميل الكتاب», the "نبذة"
 * card (expandable), the "معلومات الكتاب" rows, and the rating + comment card
 * with the doctors' comments. Every action is the existing backend one
 * (bookmark, like, rating, comments, file screen, share).
 */
export default function BookDetailScreen() {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const { t } = useTranslation('veterinaryBooks');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const id = bookId ?? '';

  const q = useContentItem(id);
  const favorite = useToggleContentBookmark(id);
  const like = useToggleContentLike(id);
  const rating = useContentRating(id);
  const submitRating = useSubmitContentRating(id);
  const comments = useContentComments(id);
  const addComment = useAddContentComment(id);
  const [commentDraft, setCommentDraft] = useState('');
  const [pickedRating, setPickedRating] = useState<number | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Called before the early returns so the hook order is identical on every render.
  const cover = q.data?.files.find((f) => f.kind === 'COVER');
  // Prefer the DTO's server-resolved cover URL; the per-file download link is
  // only a fallback (e.g. an older cached DTO without `coverUrl`).
  const coverUrl = useContentFileUrl(id, cover?.id, {
    enabled: Boolean(cover) && !q.data?.coverUrl,
  });
  const coverSrc = q.data?.coverUrl ?? coverUrl.data?.url ?? null;

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="book-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.veterinaryBooksHome)}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const book = q.data;
  const mainFile = book?.files.find((f) => f.kind === 'MAIN');
  const primaryCategory = book?.categories[0]?.name;
  const avg = rating.data?.aggregate.average ?? book?.rating.average ?? 0;
  const ratingCount = rating.data?.aggregate.count ?? book?.rating.count ?? 0;
  const myRating = pickedRating ?? rating.data?.myRating ?? 0;
  const brand = dark ? theme.colors.primary : C.brand;
  const border = dark ? theme.colors.border : C.border;

  const onShare = () => {
    if (!book) return;
    void shareText(book.title).then((outcome) => {
      if (outcome === 'copied') toast.show({ tone: 'success', message: tc('share.copied') });
      else if (outcome === 'unavailable')
        toast.show({ tone: 'info', message: tc('share.unavailable') });
    });
  };

  const onError = (error: unknown) =>
    toast.show({ tone: 'danger', message: apiErrorMessage(error) });

  // «إرسال التقييم»: the picked stars (when changed) and the comment (when written).
  const ratingChanged = pickedRating !== null && pickedRating !== (rating.data?.myRating ?? 0);
  const canSubmit =
    (ratingChanged || commentDraft.trim().length > 0) &&
    !submitRating.isPending &&
    !addComment.isPending;
  const onSubmitReview = () => {
    if (!canSubmit) return;
    if (ratingChanged && pickedRating) {
      submitRating.mutate(pickedRating, {
        onSuccess: () => setPickedRating(null),
        onError,
      });
    }
    const body = commentDraft.trim();
    if (body) {
      addComment.mutate(body, {
        onSuccess: () => {
          setCommentDraft('');
          toast.show({ tone: 'success', message: t('detail.reviewSent') });
        },
        onError,
      });
    }
  };

  const roundButton = (icon: IconName, label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: dark ? theme.colors.border : C.headerBorder,
        backgroundColor: pressed
          ? dark
            ? theme.colors.surfaceAccent
            : C.light
          : theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.xs,
      })}
    >
      <Icon name={icon} size="iconSm" color="primary" />
    </Pressable>
  );

  const card = (children: ReactNode) => (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.xs,
      }}
    >
      {children}
    </View>
  );

  const cardTitle = (label: string) => (
    <Text
      style={{
        fontFamily: theme.fontFamily.displayBold,
        fontSize: 17,
        lineHeight: 26,
        color: brand,
        marginBottom: 8,
      }}
    >
      {label}
    </Text>
  );

  const RATING_LABEL_KEYS = [
    'detail.ratingLabel.r1',
    'detail.ratingLabel.r2',
    'detail.ratingLabel.r3',
    'detail.ratingLabel.r4',
    'detail.ratingLabel.r5',
  ] as const;
  const ratingLabelKey = myRating > 0 ? RATING_LABEL_KEYS[myRating - 1] : undefined;
  const ratingLabel = ratingLabelKey ? t(ratingLabelKey) : null;

  const infoRows: { icon: IconName; label: string; value: string }[] = [];
  if (book?.authorName) {
    infoRows.push({ icon: 'person-outline', label: t('detail.author'), value: book.authorName });
  }
  if (primaryCategory) {
    infoRows.push({
      icon: 'pricetag-outline',
      label: t('detail.category'),
      value: primaryCategory,
    });
  }
  if (book?.language) {
    infoRows.push({ icon: 'language-outline', label: t('detail.language'), value: book.language });
  }
  if (book?.pageCount != null) {
    infoRows.push({
      icon: 'reader-outline',
      label: t('detail.pageCount'),
      value: t('detail.pages', { count: book.pageCount }),
    });
  }
  if (book?.publishYear != null) {
    infoRows.push({
      icon: 'calendar-outline',
      label: t('detail.publishYear'),
      value: String(book.publishYear),
    });
  }

  return (
    <ScrollScreen padded={false}>
      {/* Header: back on the physical left; share + favourite on the other side. */}
      <View
        style={{
          flexDirection: physicalRow(),
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        {roundButton('arrow-back', tc('actions.back'), () => router.back())}
        <View style={{ flexDirection: 'row', columnGap: 10 }}>
          {roundButton('share-social-outline', t('detail.shareA11y'), onShare)}
          {book
            ? roundButton(
                book.isBookmarked ? 'bookmark' : 'bookmark-outline',
                t('detail.favoriteA11y'),
                () => favorite.mutate(!book.isBookmarked, { onError }),
              )
            : null}
        </View>
      </View>

      {q.isLoading || !book ? (
        <View style={{ padding: 20 }}>
          <SkeletonText lines={8} />
        </View>
      ) : (
        <>
          {/* Hero: cover + title / author / rating. */}
          <View
            style={{ flexDirection: 'row', columnGap: 16, paddingHorizontal: 20, paddingTop: 12 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('detail.readBook')}
              disabled={!mainFile}
              onPress={() => mainFile && router.push(Routes.contentFile(book.id, mainFile.id))}
              style={{
                width: 144,
                height: 190,
                borderRadius: 8,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: C.brand,
                backgroundColor: '#0C4B2E',
                alignItems: 'center',
                justifyContent: 'center',
                ...theme.shadows.card,
              }}
            >
              {coverSrc ? (
                <Image
                  source={{ uri: coverSrc }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Icon name="book" size="iconXl" color="onPrimary" />
              )}
            </Pressable>
            <View style={{ flex: 1, paddingTop: 4, minWidth: 0 }}>
              <Text
                style={{
                  fontFamily: theme.fontFamily.displayBold,
                  fontSize: 20,
                  lineHeight: 30,
                  color: theme.colors.textPrimary,
                }}
              >
                {book.title}
              </Text>
              {primaryCategory ? (
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 20,
                    color: theme.colors.textMuted,
                    marginTop: 4,
                  }}
                >
                  {primaryCategory}
                </Text>
              ) : null}
              {book.authorName ? (
                <Text
                  style={{
                    fontFamily: theme.fontFamily.displayBold,
                    fontSize: 14,
                    lineHeight: 21,
                    color: brand,
                    marginTop: 8,
                  }}
                >
                  {book.authorName}
                </Text>
              ) : null}
              <View
                style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6, marginTop: 12 }}
                accessible
                accessibilityLabel={
                  ratingCount > 0
                    ? t('card.ratingA11y', { value: avg.toFixed(1), count: ratingCount })
                    : t('detail.noRatings')
                }
              >
                <View style={{ flexDirection: 'row', columnGap: 2 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Icon
                      key={i}
                      name={i <= Math.round(avg) ? 'star' : 'star-outline'}
                      size={16}
                      color="warning"
                    />
                  ))}
                </View>
                <Text style={{ fontSize: 12, lineHeight: 18, color: theme.colors.textMuted }}>
                  {ratingCount > 0 ? `(${ratingCount})` : t('detail.noRatings')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('detail.likeA11y')}
                accessibilityState={{ selected: book.isLiked }}
                onPress={() => like.mutate(!book.isLiked, { onError })}
                hitSlop={6}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 4,
                  marginTop: 10,
                  alignSelf: 'flex-start',
                }}
              >
                <Icon name={book.isLiked ? 'heart' : 'heart-outline'} size={16} color="danger" />
                <Text style={{ fontSize: 12, lineHeight: 18, color: theme.colors.textSecondary }}>
                  {book.likeCount}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Read / download — both open the book file (the file screen offers the download). */}
          {mainFile ? (
            <View
              style={{ flexDirection: 'row', columnGap: 12, paddingHorizontal: 20, marginTop: 20 }}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(Routes.contentFile(book.id, mainFile.id))}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  columnGap: 8,
                  backgroundColor: pressed ? C.brandDark : C.brand,
                  ...theme.shadows.xs,
                })}
              >
                <Icon name="book-outline" size="iconSm" color="onPrimary" />
                <Text
                  style={{
                    fontFamily: theme.fontFamily.displayBold,
                    fontSize: 15,
                    lineHeight: 22,
                    color: '#FFFFFF',
                  }}
                >
                  {t('detail.readBook')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(Routes.contentFile(book.id, mainFile.id))}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  columnGap: 8,
                  borderWidth: 1,
                  borderColor: C.brand,
                  backgroundColor: pressed
                    ? dark
                      ? theme.colors.surfaceAccent
                      : C.light
                    : theme.colors.surface,
                  ...theme.shadows.xs,
                })}
              >
                <Icon name="download-outline" size="iconSm" color="primary" />
                <Text
                  style={{
                    fontFamily: theme.fontFamily.displayBold,
                    fontSize: 15,
                    lineHeight: 22,
                    color: brand,
                  }}
                >
                  {t('detail.downloadBook')}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {book.description || book.body
            ? card(
                <>
                  {cardTitle(t('detail.aboutTitle'))}
                  {book.description ? (
                    <Text
                      numberOfLines={aboutOpen ? undefined : 3}
                      style={{ fontSize: 13.5, lineHeight: 22, color: theme.colors.textSecondary }}
                    >
                      {book.description}
                    </Text>
                  ) : null}
                  {aboutOpen && book.body ? (
                    <View style={{ marginTop: 8 }}>
                      <ContentBody body={book.body} />
                    </View>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setAboutOpen((v) => !v)}
                    hitSlop={6}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      columnGap: 4,
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.displayBold,
                        fontSize: 13.5,
                        lineHeight: 20,
                        color: brand,
                      }}
                    >
                      {aboutOpen ? t('detail.readLess') : t('detail.readMore')}
                    </Text>
                    <Icon
                      name={aboutOpen ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="primary"
                    />
                  </Pressable>
                </>,
              )
            : null}

          {card(
            <>
              {cardTitle(t('detail.infoTitle'))}
              {infoRows.map((row, i) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    columnGap: 12,
                    paddingVertical: 10,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: dark ? theme.colors.border : C.divider,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
                    <Icon name={row.icon} size="iconSm" color="primary" />
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.bodyMedium,
                        fontSize: 14,
                        lineHeight: 21,
                        color: theme.colors.textSecondary,
                      }}
                    >
                      {row.label}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      flexShrink: 1,
                      fontFamily: theme.fontFamily.displayBold,
                      fontSize: 14,
                      lineHeight: 21,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </>,
          )}

          {card(
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: 8,
                    flexShrink: 1,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: dark ? theme.colors.surfaceAccent : C.light,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="star" size={13} color="primary" />
                  </View>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.displayBold,
                      fontSize: 17,
                      lineHeight: 26,
                      color: brand,
                      flexShrink: 1,
                    }}
                  >
                    {t('detail.reviewTitle')}
                  </Text>
                </View>
                {ratingLabel ? (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: dark ? theme.colors.surfaceAccent : C.light,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.displaySemiBold,
                        fontSize: 12,
                        lineHeight: 18,
                        color: brand,
                      }}
                    >
                      {ratingLabel}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: dark ? theme.colors.surfaceAccent : C.soft,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 18,
                    color: theme.colors.textMuted,
                    marginBottom: 6,
                  }}
                >
                  {t('detail.tapStars')}
                </Text>
                <View
                  style={{ flexDirection: 'row', columnGap: 6 }}
                  accessibilityRole="adjustable"
                  accessibilityLabel={t('detail.rateA11y')}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Pressable
                      key={i}
                      accessibilityRole="button"
                      accessibilityLabel={t('detail.rateValueA11y', { value: i })}
                      accessibilityState={{ selected: i <= myRating }}
                      onPress={() => setPickedRating(i)}
                      hitSlop={4}
                    >
                      <Icon
                        name={i <= myRating ? 'star' : 'star-outline'}
                        size={28}
                        color="warning"
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              <TextInput
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder={t('detail.reviewPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                accessibilityLabel={t('detail.reviewPlaceholder')}
                multiline
                textAlignVertical="top"
                style={{
                  minHeight: 84,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fontFamily.bodyRegular,
                  fontSize: 13.5,
                  lineHeight: 22,
                  textAlign: isRTL() ? 'right' : 'left',
                  writingDirection: isRTL() ? 'rtl' : 'ltr',
                  marginBottom: 12,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit }}
                disabled={!canSubmit}
                onPress={onSubmitReview}
                style={({ pressed }) => ({
                  height: 44,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  columnGap: 8,
                  backgroundColor: !canSubmit
                    ? theme.colors.border
                    : pressed
                      ? C.brandDark
                      : C.brand,
                })}
              >
                <Icon name="send" directional size={16} color="onPrimary" />
                <Text
                  style={{
                    fontFamily: theme.fontFamily.displayBold,
                    fontSize: 14,
                    lineHeight: 21,
                    color: '#FFFFFF',
                  }}
                >
                  {t('detail.submitReview')}
                </Text>
              </Pressable>

              <View
                style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: border }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
                    <Icon name="chatbubbles-outline" size={16} color="primary" />
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.displayBold,
                        fontSize: 14,
                        lineHeight: 21,
                        color: theme.colors.textPrimary,
                      }}
                    >
                      {t('detail.doctorComments')}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: dark ? theme.colors.surfaceAccent : C.light,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.displayBold,
                        fontSize: 11,
                        lineHeight: 16,
                        color: brand,
                      }}
                    >
                      {t('detail.commentsCount', {
                        count: comments.data?.meta.total ?? book.commentCount,
                      })}
                    </Text>
                  </View>
                </View>
                {comments.isLoading ? (
                  <SkeletonText lines={3} />
                ) : (comments.data?.items.length ?? 0) === 0 ? (
                  <Text style={{ fontSize: 12.5, lineHeight: 20, color: theme.colors.textMuted }}>
                    {t('detail.noComments')}
                  </Text>
                ) : (
                  <View style={{ rowGap: 10 }}>
                    {comments.data?.items.map((c) => {
                      const name = `${c.authorName.firstName} ${c.authorName.lastName}`.trim();
                      return (
                        <View
                          key={c.id}
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: border,
                            backgroundColor: dark ? theme.colors.surfaceAccent : C.soft,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              columnGap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <View
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: 'rgba(7,150,83,0.1)',
                                borderWidth: 1,
                                borderColor: 'rgba(7,150,83,0.2)',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: theme.fontFamily.displayBold,
                                  fontSize: 11,
                                  lineHeight: 16,
                                  color: brand,
                                }}
                              >
                                {initialsOf(name)}
                              </Text>
                            </View>
                            <View style={{ flexShrink: 1 }}>
                              <Text
                                style={{
                                  fontFamily: theme.fontFamily.displayBold,
                                  fontSize: 12,
                                  lineHeight: 18,
                                  color: theme.colors.textPrimary,
                                }}
                              >
                                {name}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 10,
                                  lineHeight: 15,
                                  color: theme.colors.textMuted,
                                }}
                              >
                                {formatDate(c.createdAt)}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={{
                              fontSize: 12.5,
                              lineHeight: 20,
                              color: theme.colors.textSecondary,
                              paddingStart: 36,
                            }}
                          >
                            {c.body}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
                {comments.data && comments.data.meta.total > comments.data.items.length ? (
                  <Text
                    style={{
                      fontSize: 12,
                      lineHeight: 18,
                      color: theme.colors.textMuted,
                      marginTop: 8,
                    }}
                  >
                    {t('detail.moreComments', { count: comments.data.meta.total })}
                  </Text>
                ) : null}
              </View>
            </>,
          )}
          <View style={{ height: theme.spacing.huge }} />
        </>
      )}
    </ScrollScreen>
  );
}
