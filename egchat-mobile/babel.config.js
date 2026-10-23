module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-worklets-core — necesario para VisionCamera Frame Processors
      ['react-native-worklets-core/plugin'],
    ],
  };
};
