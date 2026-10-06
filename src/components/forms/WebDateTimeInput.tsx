export interface WebDateTimeInputProps {
  mode: 'date' | 'time';
  /** `YYYY-MM-DD` (date) or `HH:MM` (time); `''` when empty. */
  value: string;
  /** `YYYY-MM-DD` lower bound (date mode only). */
  min?: string;
  onChange: (next: string) => void;
  accessibilityLabel: string;
  invalid?: boolean;
}

/**
 * Native platforms use `@react-native-community/datetimepicker` instead — this
 * stub is never rendered there. The real input lives in `WebDateTimeInput.web.tsx`.
 */
export function WebDateTimeInput(_props: WebDateTimeInputProps): null {
  return null;
}
