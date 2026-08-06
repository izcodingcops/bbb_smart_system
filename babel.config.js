module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        // The module must build and run with no key at all — see the keyless
        // fallback in src/services/maps.ts.
        allowUndefined: true,
      },
    ],
  ],
};
