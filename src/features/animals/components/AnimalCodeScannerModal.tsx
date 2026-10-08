import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Modal } from '@/components/overlays';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

/**
 * Legacy dashboard barcode search ("مسح الباركود"): scans a QR / barcode
 * (same symbologies the legacy scanner accepted) and hands back its text —
 * normally the short pet ID from the owner's Pet Details QR (older QRs carry
 * the UUID). The caller opens the pet with it via the lookup route.
 */
export function AnimalCodeScannerModal({
  visible,
  onClose,
  onScanned,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  const onBarcode = ({ data }: BarcodeScanningResult) => {
    if (handled.current || !data?.trim()) return;
    handled.current = true;
    onScanned(data.trim());
  };

  return (
    <Modal
      visible={visible}
      onClose={() => {
        handled.current = false;
        onClose();
      }}
      title={t('scanner.title')}
    >
      {!permission ? (
        <Caption>{t('scanner.checkingPermission')}</Caption>
      ) : !permission.granted ? (
        <View style={{ rowGap: theme.spacing.md }}>
          <Caption>{t('scanner.permissionNeeded')}</Caption>
          <Button label={t('scanner.grantPermission')} onPress={() => void requestPermission()} />
        </View>
      ) : (
        <View style={{ rowGap: theme.spacing.sm }}>
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: theme.radius.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.overlay,
            }}
          >
            {visible ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'upc_e', 'upc_a'],
                }}
                onBarcodeScanned={onBarcode}
              />
            ) : null}
          </View>
          <Caption center>{t('scanner.hint')}</Caption>
        </View>
      )}
    </Modal>
  );
}
