module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-redux|immer|@reduxjs|@react-navigation|react-native-safe-area-context|react-native-image-picker)/)',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^react-native-device-info$':
      'react-native-device-info/jest/react-native-device-info-mock',
  },
};
