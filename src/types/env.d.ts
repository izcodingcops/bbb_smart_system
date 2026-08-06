/**
 * The virtual module react-native-dotenv synthesises at build time. Typed as
 * possibly-undefined because `allowUndefined` is on and a build with no .env
 * is a supported configuration.
 */
declare module '@env' {
  export const GOOGLE_MAPS_API_KEY: string | undefined;
}
