import { create } from 'qrcode';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

export interface QrCodeProps {
  /** The text to encode. Keep it free of sensitive data — anyone can scan it. */
  value: string;
  /** Rendered edge length in dp (quiet zone included). */
  size?: number;
  /** Module colour — dark-on-light is the only reliably scannable combination. */
  color?: string;
  backgroundColor?: string;
  accessibilityLabel?: string;
}

const QUIET_ZONE = 2;

/**
 * A scannable QR code rendered with plain Views (no SVG / native module): the
 * matrix comes from the pure-JS `qrcode` encoder and each dark run of a row
 * becomes one View, so a typical farm-code QR is well under ~400 nodes.
 */
export const QrCode = memo(function QrCode({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  accessibilityLabel,
}: QrCodeProps) {
  const rows = useMemo(() => {
    const matrix = create(value, { errorCorrectionLevel: 'M' }).modules;
    const out: { start: number; length: number }[][] = [];
    for (let r = 0; r < matrix.size; r += 1) {
      const runs: { start: number; length: number }[] = [];
      let c = 0;
      while (c < matrix.size) {
        if (matrix.get(r, c)) {
          const start = c;
          while (c < matrix.size && matrix.get(r, c)) c += 1;
          runs.push({ start, length: c - start });
        } else {
          c += 1;
        }
      }
      out.push(runs);
    }
    return out;
  }, [value]);

  const cells = rows.length + QUIET_ZONE * 2;
  const unit = size / cells;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      // Forced LTR: in an RTL app `left` would otherwise mean "start" and the
      // code would render mirrored (unscannable).
      style={{ width: size, height: size, backgroundColor, padding: unit * QUIET_ZONE, direction: 'ltr' }}
    >
      {rows.map((runs, r) => (
        <View key={r} style={{ height: unit, flexDirection: 'row', direction: 'ltr' }}>
          {runs.map((run) => (
            <View
              key={run.start}
              style={{
                position: 'absolute',
                left: run.start * unit,
                width: run.length * unit,
                height: unit,
                backgroundColor: color,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
});
