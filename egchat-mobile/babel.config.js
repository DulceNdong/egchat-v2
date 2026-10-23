module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Nota: react-native-worklets-core/plugin se activará cuando
    // implementemos Frame Processors en Fase 4.
    // Por ahora usamos VisionCamera sin worklets para builds estables.
  };
};
