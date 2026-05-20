const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {withNativeWind} = require('nativewind/metro');

const config = mergeConfig(getDefaultConfig(__dirname), {});

module.exports = withNativeWind(config, {
  input: path.join(__dirname, 'global.css'),
  projectRoot: __dirname,
});
