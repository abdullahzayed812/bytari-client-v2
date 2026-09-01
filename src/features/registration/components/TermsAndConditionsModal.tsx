import type { ReactNode } from 'react';
import { Modal, ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { Text } from '@/components/typography';
import { useTheme, type Theme } from '@/theme';

export interface TermsAndConditionsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  accountType?: 'pet_owner' | 'veterinarian' | 'poultry';
}

/**
 * Full legal terms + privacy agreement for registration. Kept as hardcoded
 * Arabic (not routed through i18n like the rest of the app's UI strings) —
 * this is app-store-facing legal text, and fabricating an English legal
 * translation isn't something to do silently. Add an `en` version here
 * (and switch on `i18n.language`) once one exists.
 */
export function TermsAndConditionsModal({
  visible,
  onClose,
  onAccept,
  accountType = 'pet_owner',
}: TermsAndConditionsModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const s = styles(theme);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={[s.sheet, { marginBottom: insets.bottom }]}>
          <View style={s.header}>
            <Text variant="title" weight="bold" style={s.headerTitle}>
              {accountType === 'poultry'
                ? 'شروط وأحكام قسم الدواجن'
                : 'اتفاقية الاستخدام وشروط التسجيل'}
            </Text>
            <IconButton icon="close" accessibilityLabel="إغلاق" size="sm" onPress={onClose} />
          </View>

          <ScrollView style={s.scroll} showsVerticalScrollIndicator>
            <View style={s.content}>
              {accountType === 'poultry' ? (
                <PoultryTerms s={s} />
              ) : (
                <GeneralTerms s={s} accountType={accountType} />
              )}
            </View>
          </ScrollView>

          <View style={s.footer}>
            <Button label="أوافق على الشروط" fullWidth onPress={onAccept} />
            <Button label="إلغاء" variant="outline" fullWidth onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- content ------------------------------------------------------------

type Styles = ReturnType<typeof styles>;

function SectionTitle({ children, s }: { children: string; s: Styles }) {
  return (
    <Text variant="title" weight="bold" color="primary" style={s.sectionTitle}>
      {children}
    </Text>
  );
}

function SubSectionTitle({ children, s }: { children: string; s: Styles }) {
  return (
    <Text variant="bodyStrong" style={s.subSectionTitle}>
      {children}
    </Text>
  );
}

function Paragraph({ children, s }: { children: ReactNode; s: Styles }) {
  return (
    <Text variant="body" style={s.paragraph}>
      {children}
    </Text>
  );
}

function ListItem({ children, s }: { children: string; s: Styles }) {
  return (
    <Text variant="body" style={s.listItem}>
      • {children}
    </Text>
  );
}

function ContactSection({ s }: { s: Styles }) {
  return (
    <View style={s.contactSection}>
      <Text variant="bodyStrong" style={s.contactTitle}>
        معلومات التواصل:
      </Text>
      <Text variant="body" color="textSecondary">
        اسم التطبيق: بيطري
      </Text>
      <Text variant="body" color="textSecondary">
        البريد الرسمي: baytariapp@gmail.com
      </Text>
      <Text variant="body" color="textSecondary">
        رقم التواصل: 009647777564666
      </Text>
    </View>
  );
}

function PoultryTerms({ s }: { s: Styles }) {
  return (
    <>
      <Alert
        tone="warning"
        message="يرجى قراءة هذه الشروط والأحكام بعناية قبل إنشاء حساب تاجر أو تسجيل حقل دواجن. باستخدامك لقسم الدواجن في التطبيق فإنك توافق على جميع البنود الواردة أدناه."
      />

      <SubSectionTitle s={s}>1. صحة البيانات</SubSectionTitle>
      <ListItem s={s}>
        يقر المستخدم بأن جميع المعلومات المدخلة صحيحة، ويتحمل مسؤولية أي معلومات غير صحيحة أو مضللة.
      </ListItem>

      <SubSectionTitle s={s}>2. الإعلانات</SubSectionTitle>
      <ListItem s={s}>
        يمنع نشر إعلانات وهمية أو مكررة أو تحتوي على معلومات غير صحيحة عن الدواجن أو البيض أو
        الأسعار.
      </ListItem>

      <SubSectionTitle s={s}>3. التواصل بين الأطراف</SubSectionTitle>
      <ListItem s={s}>
        التطبيق يوفر وسيلة للتواصل بين البائع والمشتري ولا يتحمل مسؤولية أي اتفاق أو عملية بيع أو
        شراء بين العملاء.
      </ListItem>

      <SubSectionTitle s={s}>4. أسعار البورصة</SubSectionTitle>
      <ListItem s={s}>
        الأسعار المعروضة في بورصة الدواجن وبورصة البيض هي أسعار استرشادية وقد تختلف حسب المنطقة
        والجودة والكمية، ويجب التأكد منها قبل أي اتفاق.
      </ListItem>

      <SubSectionTitle s={s}>5. الحقول المسجلة</SubSectionTitle>
      <ListItem s={s}>
        يتحمل صاحب الحقل مسؤولية جميع البيانات والأعداد والإحصائيات المدخلة داخل الحقل.
      </ListItem>

      <SubSectionTitle s={s}>6. الأطباء والموظفون</SubSectionTitle>
      <ListItem s={s}>
        صاحب الحقل مسؤول عن منح الصلاحيات للأطباء البيطريين والموظفين وإدارة حساباتهم.
      </ListItem>

      <SubSectionTitle s={s}>7. المحتوى المخالف</SubSectionTitle>
      <Alert
        tone="danger"
        message="يحق لإدارة التطبيق حذف أي إعلان أو حساب أو حقل يخالف الشروط دون إشعار مسبق."
      />

      <SubSectionTitle s={s}>8. الخصوصية</SubSectionTitle>
      <ListItem s={s}>
        يوافق المستخدم على استخدام البيانات المدخلة لأغراض تشغيل خدمات التطبيق وتحسينها.
      </ListItem>

      <SubSectionTitle s={s}>9. الاشتراكات</SubSectionTitle>
      <ListItem s={s}>
        الاشتراكات والرسوم المدفوعة غير قابلة للاسترداد بعد تفعيل الخدمة إلا في الحالات التي تحددها
        إدارة التطبيق.
      </ListItem>

      <SubSectionTitle s={s}>10. الملكية الفكرية</SubSectionTitle>
      <ListItem s={s}>
        جميع حقوق التطبيق والتصميم والبرمجيات والأنظمة التابعة له محفوظة لإدارة التطبيق، ولا يجوز
        نسخها أو إعادة بيعها أو استغلالها دون إذن رسمي.
      </ListItem>

      <SubSectionTitle s={s}>11. فقدان البيانات</SubSectionTitle>
      <ListItem s={s}>
        لا يتحمل التطبيق أي مسؤولية في حالة فقدان البيانات دون قصد أو خلل برمجي.
      </ListItem>

      <SubSectionTitle s={s}>12. الموافقة</SubSectionTitle>
      <ListItem s={s}>
        باستخدام قسم الدواجن أو إنشاء حساب تاجر أو حقل دواجن فإن المستخدم يوافق على جميع الشروط
        والأحكام، ويحق للتطبيق تعديل الشروط في أي وقت، واستمرار الاستخدام يعني الموافقة على
        التحديثات.
      </ListItem>

      <ContactSection s={s} />
    </>
  );
}

function GeneralTerms({
  s,
  accountType,
}: {
  s: Styles;
  accountType: 'pet_owner' | 'veterinarian';
}) {
  return (
    <>
      <Alert
        tone="warning"
        message="يرجى قراءة هذه الاتفاقية بعناية قبل التسجيل أو استخدام التطبيق. إن قيامك بإنشاء حساب أو استخدام أي من خدمات التطبيق يُعد موافقة صريحة وملزمة قانونيًا على جميع الشروط والأحكام الواردة أدناه."
      />

      <SectionTitle s={s}>أولًا: التعريفات</SectionTitle>
      <Paragraph s={s}>
        <Text weight="bold">التطبيق:</Text> يقصد به منصة البيطري بجميع خدماتها الإلكترونية.
      </Paragraph>
      <Paragraph s={s}>
        <Text weight="bold">المستخدم:</Text> كل من يقوم بإنشاء حساب على التطبيق.
      </Paragraph>
      <Paragraph s={s}>
        <Text weight="bold">صاحب الحيوان:</Text> المستخدم الذي يسجل حيواناته للاستفادة من الخدمات.
      </Paragraph>
      <Paragraph s={s}>
        <Text weight="bold">الطبيب البيطري:</Text> كل طبيب أو طالب أو عيادة أو مكتب بيطري مسجل
        مهنيًا على المنصة.
      </Paragraph>
      <Paragraph s={s}>
        <Text weight="bold">الاستشارات:</Text> الآراء الطبية المقدمة عبر التطبيق (بشرية أو عبر
        الذكاء الاصطناعي).
      </Paragraph>

      <SectionTitle s={s}>ثانيًا: طبيعة الخدمة</SectionTitle>
      <ListItem s={s}>
        التطبيق منصة رقمية وسيطة تربط بين أصحاب الحيوانات والأطباء والعيادات والمتاجر البيطرية.
      </ListItem>
      <ListItem s={s}>التطبيق لا يُعد منشأة طبية ولا يقدم علاجًا مباشرًا.</ListItem>
      <ListItem s={s}>
        جميع الخدمات الطبية المقدمة هي مسؤولية مقدّمها (الطبيب/العيادة) وليست مسؤولية التطبيق.
      </ListItem>

      {accountType === 'pet_owner' ? (
        <>
          <SectionTitle s={s}>شروط استخدام صاحب الحيوان</SectionTitle>

          <SubSectionTitle s={s}>1. إنشاء الحساب</SubSectionTitle>
          <ListItem s={s}>يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة عن نفسه وعن الحيوان.</ListItem>
          <ListItem s={s}>يتحمل المسؤولية الكاملة عن أي معلومات خاطئة أو مضللة.</ListItem>

          <SubSectionTitle s={s}>2. السجلات الطبية والمتابعات والإضافات</SubSectionTitle>
          <ListItem s={s}>
            يوافق المستخدم على إمكانية مشاركة بيانات حيوانه مع العيادات بعد منحه الإذن.
          </ListItem>
          <ListItem s={s}>التطبيق غير مسؤول عن أي استخدام طبي للبيانات من قبل الطبيب.</ListItem>

          <SubSectionTitle s={s}>3. الاستشارات الطبية</SubSectionTitle>
          <ListItem s={s}>الاستشارات عبر التطبيق هي لأغراض إرشادية فقط.</ListItem>
          <ListItem s={s}>لا تغني عن الفحص السريري المباشر.</ListItem>
          <ListItem s={s}>
            التطبيق غير مسؤول عن أي قرارات علاجية يتخذها المستخدم بناءً على الاستشارة.
          </ListItem>

          <SubSectionTitle s={s}>4. استشارات الذكاء الاصطناعي</SubSectionTitle>
          <ListItem s={s}>
            بعض الردود تتم عبر أنظمة ذكاء اصطناعي (ذكاء اصطناعي مختص بالطب البيطري) في الأوقات التي
            لا يتوفر أطباء بيطريين متاحين.
          </ListItem>
          <ListItem s={s}>قد تحتوي على أخطاء أو معلومات غير مكتملة.</ListItem>
          <Alert tone="danger" message="لا يُعتمد عليها كتشخيص نهائي." />

          <SubSectionTitle s={s}>5. المتجر الإلكتروني</SubSectionTitle>
          <ListItem s={s}>التطبيق وسيط بيع بين المستخدم والبائع.</ListItem>
          <ListItem s={s}>مسؤولية جودة المنتجات تقع على البائع.</ListItem>
          <ListItem s={s}>لا يتحمل التطبيق أي أضرار ناتجة عن سوء استخدام المنتجات.</ListItem>

          <SubSectionTitle s={s}>6. فقدان البيانات</SubSectionTitle>
          <ListItem s={s}>
            لا يتحمل التطبيق أي مسؤولية في حالة فقدان البيانات دون قصد أو خلل برمجي.
          </ListItem>

          <SubSectionTitle s={s}>7. حدود المسؤولية</SubSectionTitle>
          <Paragraph s={s}>يُخلي صاحب التطبيق مسؤوليته القانونية عن:</Paragraph>
          <ListItem s={s}>أي ضرر يصيب الحيوان نتيجة استشارة أو علاج.</ListItem>
          <ListItem s={s}>سوء استخدام الأدوية أو المنتجات.</ListItem>
          <ListItem s={s}>أخطاء التشخيص عن بُعد.</ListItem>
          <ListItem s={s}>الاعتماد على الذكاء الاصطناعي دون مراجعة مختص.</ListItem>
          <ListItem s={s}>التعاملات التجارية بين المستخدمين.</ListItem>

          <SubSectionTitle s={s}>8. إخلاء المسؤولية الطبية</SubSectionTitle>
          <Paragraph s={s}>جميع المعلومات داخل التطبيق:</Paragraph>
          <ListItem s={s}>لأغراض تثقيفية وإرشادية فقط.</ListItem>
          <ListItem s={s}>لا تُعد بديلًا عن الفحص البيطري المباشر.</ListItem>
        </>
      ) : (
        <>
          <SectionTitle s={s}>شروط الأطباء والعيادات والمذاخر</SectionTitle>

          <SubSectionTitle s={s}>1. التحقق والتراخيص</SubSectionTitle>
          <ListItem s={s}>يلتزم الطبيب/طالب الطب البيطري بتقديم وثائق رسمية سارية.</ListItem>
          <ListItem s={s}>يحق للتطبيق رفض أو إلغاء أي حساب دون إبداء الأسباب.</ListItem>

          <SubSectionTitle s={s}>2. المسؤولية الطبية</SubSectionTitle>
          <Paragraph s={s}>يتحمل الطبيب كامل المسؤولية القانونية والمهنية عن:</Paragraph>
          <ListItem s={s}>التشخيص</ListItem>
          <ListItem s={s}>الوصفات</ListItem>
          <ListItem s={s}>الاستشارات</ListItem>
          <ListItem s={s}>التوصيات العلاجية</ListItem>
          <Alert tone="danger" message="التطبيق غير مسؤول عن الأخطاء الطبية أو المضاعفات." />

          <SubSectionTitle s={s}>3. الاستشارات داخل المنصة</SubSectionTitle>
          <ListItem s={s}>يلتزم الطبيب بتقديم معلومات دقيقة ومهنية.</ListItem>
          <ListItem s={s}>يمنع تقديم وصفات خطرة دون فحص عند الإمكان.</ListItem>

          <SubSectionTitle s={s}>4. استخدام الذكاء الاصطناعي</SubSectionTitle>
          <ListItem s={s}>قد تُستخدم أنظمة ذكاء اصطناعي مساعدة.</ListItem>
          <ListItem s={s}>الطبيب مسؤول عن مراجعة أي رد قبل اعتماده طبيًا.</ListItem>

          <SubSectionTitle s={s}>5. إضافة العيادات والمتاجر</SubSectionTitle>
          <ListItem s={s}>يلتزم مقدم الخدمة بصحة بيانات الموقع والتراخيص.</ListItem>
          <ListItem s={s}>يتحمل المسؤولية القانونية عن المنتجات أو الخدمات المباعة.</ListItem>

          <SubSectionTitle s={s}>6. المتجر الإلكتروني</SubSectionTitle>
          <ListItem s={s}>التطبيق وسيط بيع بين المستخدم والبائع.</ListItem>
          <ListItem s={s}>مسؤولية جودة المنتجات تقع على البائع.</ListItem>
          <ListItem s={s}>لا يتحمل التطبيق أي أضرار ناتجة عن سوء استخدام المنتجات.</ListItem>

          <SubSectionTitle s={s}>7. فقدان البيانات</SubSectionTitle>
          <ListItem s={s}>
            لا يتحمل التطبيق أي مسؤولية في حالة فقدان البيانات دون قصد أو خلل برمجي.
          </ListItem>

          <SubSectionTitle s={s}>8. القوانين العامة</SubSectionTitle>
          <ListItem s={s}>
            تسري على الأطباء البيطريين والطلاب جميع القوانين سارية في اتفاقية صاحب الحيوان.
          </ListItem>
        </>
      )}

      <SectionTitle s={s}>الشروط المشتركة</SectionTitle>

      <SubSectionTitle s={s}>9. الخصوصية والبيانات</SubSectionTitle>
      <ListItem s={s}>يوافق المستخدم على تخزين بياناته وبيانات حيواناته.</ListItem>
      <ListItem s={s}>تُستخدم لتحسين الخدمة فقط.</ListItem>
      <ListItem s={s}>لا يتم بيع البيانات لطرف ثالث دون إذن قانوني.</ListItem>
      <ListItem s={s}>
        في حالة النزاع يحق للتطبيق تسليم البيانات الحقيقية للجهات المختصة حسب القانون.
      </ListItem>

      <SubSectionTitle s={s}>10. السلوك المحظور</SubSectionTitle>
      <Paragraph s={s}>يُمنع:</Paragraph>
      <ListItem s={s}>تقديم معلومات مزيفة.</ListItem>
      <ListItem s={s}>انتحال صفة طبيب.</ListItem>
      <ListItem s={s}>بيع منتجات غير مرخصة.</ListItem>
      <ListItem s={s}>إساءة استخدام المنصة.</ListItem>
      <Alert tone="danger" message="ويحق للتطبيق إيقاف الحساب فورًا." />

      <SubSectionTitle s={s}>11. الملكية الفكرية</SubSectionTitle>
      <Paragraph s={s}>جميع حقوق:</Paragraph>
      <ListItem s={s}>التصميم</ListItem>
      <ListItem s={s}>المحتوى</ListItem>
      <ListItem s={s}>الشعار</ListItem>
      <ListItem s={s}>البرمجيات</ListItem>
      <Paragraph s={s}>مملوكة لصاحب التطبيق ولا يجوز استخدامها دون إذن.</Paragraph>

      <SubSectionTitle s={s}>12. إيقاف الخدمة</SubSectionTitle>
      <Paragraph s={s}>يحق للتطبيق:</Paragraph>
      <ListItem s={s}>تعديل الخدمات.</ListItem>
      <ListItem s={s}>إيقاف الحسابات المخالفة.</ListItem>
      <ListItem s={s}>إلغاء أو تقييد الوصول دون إشعار مسبق.</ListItem>

      <SubSectionTitle s={s}>13. التعديلات على الاتفاقية</SubSectionTitle>
      <ListItem s={s}>يحق للتطبيق تعديل الشروط في أي وقت.</ListItem>
      <ListItem s={s}>استمرار الاستخدام يعني الموافقة على التحديثات.</ListItem>

      <SubSectionTitle s={s}>14. القانون الواجب التطبيق</SubSectionTitle>
      <Paragraph s={s}>تخضع هذه الاتفاقية لقوانين:</Paragraph>
      <ListItem s={s}>(قوانين بلدك او الدولة التي تقيم بها)</ListItem>
      <Paragraph s={s}>وتُحال النزاعات إلى محاكمها المختصة.</Paragraph>

      <SubSectionTitle s={s}>15. الإقرار والموافقة</SubSectionTitle>
      <Paragraph s={s}>بالضغط على زر &quot;موافق&quot; فإنك تقر بأنك:</Paragraph>
      <ListItem s={s}>قرأت الاتفاقية كاملة.</ListItem>
      <ListItem s={s}>فهمت جميع البنود.</ListItem>
      <ListItem s={s}>وافقت عليها دون قيد أو شرط.</ListItem>

      <ContactSection s={s} />
    </>
  );
}

// --- styles ---------------------------------------------------------------

function styles(theme: Theme) {
  return {
    backdrop: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    } satisfies ViewStyle,
    sheet: {
      width: '100%',
      maxHeight: '85%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xxl,
      overflow: 'hidden',
      ...theme.shadows.overlay,
    } satisfies ViewStyle,
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: theme.spacing.md,
      padding: theme.spacing.xl,
      borderBottomWidth: theme.sizes.hairline,
      borderBottomColor: theme.colors.divider,
    } satisfies ViewStyle,
    headerTitle: { flex: 1 },
    scroll: { padding: theme.spacing.xl },
    content: { rowGap: theme.spacing.md, paddingBottom: theme.spacing.xl },
    sectionTitle: { marginTop: theme.spacing.lg },
    subSectionTitle: { marginTop: theme.spacing.sm },
    paragraph: {},
    listItem: { paddingStart: theme.spacing.sm },
    contactSection: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.lg,
      rowGap: theme.spacing.xxs,
    } satisfies ViewStyle,
    contactTitle: { marginBottom: theme.spacing.xxs },
    footer: {
      rowGap: theme.spacing.md,
      padding: theme.spacing.xl,
      borderTopWidth: theme.sizes.hairline,
      borderTopColor: theme.colors.divider,
    } satisfies ViewStyle,
  };
}
