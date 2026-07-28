/**
 * Apollo 4 ships minified error messages by default — every failure becomes an
 * opaque go.apollo.dev URL. Loading the dev bundles restores readable text.
 * Called once from client.ts; the __DEV__ guard lets the release build drop it.
 */
export function loadApolloDevMessages(): void {
  if (!__DEV__) {
    return;
  }
  const {loadDevMessages, loadErrorMessages} = require('@apollo/client/dev');
  loadDevMessages();
  loadErrorMessages();
}
