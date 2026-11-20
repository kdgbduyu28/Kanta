// Expo config plugin: the Spotify auth library (used only when the Spotify kit .aar is added)
// needs these manifest placeholders in the app module. Harmless when the kit is not built.
const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withKanta(config) {
  return withAppBuildGradle(config, (c) => {
    const marker = 'redirectSchemeName';
    if (!c.modResults.contents.includes(marker)) {
      c.modResults.contents = c.modResults.contents.replace(
        /defaultConfig\s*\{/,
        (m) => `${m}\n        manifestPlaceholders += [redirectSchemeName: "kanta", redirectHostName: "spotify-callback"]`,
      );
    }
    return c;
  });
};
