import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Modal } from '@/components/overlays';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import { parseFarmQrPayload } from '../farmQr';

export interface FarmQrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called once with the join code of a valid Bytari farm QR. */
  onScanned: (joinCode: string) => void;
  onInvalid: () => void;
}

/**
 * Camera QR scanner for a farm's join code (`expo-camera`'s built-in barcode
 * scanning — no extra native module). Unknown QR codes are ignored with a
 * toast; the first valid one closes the scanner and hands its code back.
 */
export function FarmQrScannerModal({
  visible,
  onClose,
  onScanned,
  onInvalid,
}: FarmQrScannerModalProps) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);
  const lastInvalid = useRef<string | null>(null);

  const onBarcode = ({ data }: BarcodeScanningResult) => {
    if (handled.current) return;
    const code = parseFarmQrPayload(data);
    if (!code) {
      if (lastInvalid.current !== data) {
        lastInvalid.current = data;
        onInvalid();
      }
      return;
    }
    handled.current = true;
    onScanned(code);
  };

  return (
    <Modal
      visible={visible}
      onClose={() => {
        handled.current = false;
        lastInvalid.current = null;
        onClose();
      }}
      title={t('qr.scanTitle')}
    >
      {!permission ? (
        <Caption>{t('qr.checkingPermission')}</Caption>
      ) : !permission.granted ? (
        <View style={{ rowGap: theme.spacing.md }}>
          <Caption>{t('qr.permissionNeeded')}</Caption>
          <Button label={t('qr.grantPermission')} onPress={() => void requestPermission()} />
        </View>
      ) : (
        <View style={{ rowGap: theme.spacing.sm }}>
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: theme.radius.lg,
              overflow: 'hidden',
              backgroundColor: '#000',
            }}
          >
            {visible ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onBarcode}
              />
            ) : null}
          </View>
          <Caption center>{t('qr.scanHint')}</Caption>
        </View>
      )}
    </Modal>
  );
}
