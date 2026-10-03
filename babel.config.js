module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Strip all console.* calls in production builds (release APK/IPA)
      // This prevents leaking internal state, error details, or debug info to users
      ...(isProduction ? [['transform-remove-console', { exclude: [] }]] : []),
    ],
  };
};