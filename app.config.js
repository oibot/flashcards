const appJson = require("./app.json")

const apiOrigin = process.env.EXPO_PUBLIC_API_ORIGIN

module.exports = {
  ...appJson.expo,
  plugins: appJson.expo.plugins.map((plugin) => {
    if (plugin === "expo-router" && apiOrigin) {
      return ["expo-router", { origin: apiOrigin }]
    }

    return plugin
  }),
}
