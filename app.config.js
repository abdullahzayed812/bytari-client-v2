// google-services.json is not committed. Locally it sits next to app.json;
// on EAS it comes from the `GOOGLE_SERVICES_JSON` file environment variable
// (eas env:create --name GOOGLE_SERVICES_JSON --type file ...).
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
});
