// Stub de react-native-vision-camera para web.
// La cámara en vivo no tiene equivalente aquí: useCameraDevice devuelve null y
// LiveCamera corta antes de montar el preview, igual que cuando el dispositivo
// físico no está disponible en nativo.
const React = require('react');
const { View } = require('react-native');

const Camera = (props) => React.createElement(View, props);

const useCameraDevice = () => null;

const useCameraPermission = () => ({
  hasPermission: false,
  isError: false,
  requestPermission: async () => false,
});

const useMicrophonePermission = () => ({
  hasPermission: false,
  isError: false,
  requestPermission: async () => false,
});

module.exports = { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission };
