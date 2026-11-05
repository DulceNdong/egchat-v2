// Stub web para @react-native-community/datetimepicker
// En web usamos un input HTML nativo en su lugar
import React from 'react';
import { View } from 'react-native';

const DateTimePicker = ({ value, onChange, mode }) => {
  const inputType = mode === 'time' ? 'time' : mode === 'datetime' ? 'datetime-local' : 'date';
  const formatted = value instanceof Date
    ? mode === 'time'
      ? value.toTimeString().slice(0, 5)
      : mode === 'datetime'
      ? value.toISOString().slice(0, 16)
      : value.toISOString().slice(0, 10)
    : '';
  return React.createElement('input', {
    type: inputType,
    value: formatted,
    onChange: (e) => {
      const date = new Date(e.target.value);
      if (!isNaN(date.getTime()) && onChange) {
        onChange({ type: 'set' }, date);
      }
    },
    style: { fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #d1d5db' },
  });
};

export default DateTimePicker;
export const DateTimePickerAndroid = { open: () => {} };
