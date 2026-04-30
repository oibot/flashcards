const path = require("node:path")

const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

const unistylesRuntimePath = path.resolve(
  __dirname,
  "src/shared/styles/unistyles-runtime.ts",
)
const unistylesConfigPath = path.resolve(
  __dirname,
  "src/shared/styles/unistyles.ts",
)

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "react-native-unistyles" &&
    context.originModulePath !== unistylesRuntimePath &&
    context.originModulePath !== unistylesConfigPath
  ) {
    return {
      filePath: unistylesRuntimePath,
      type: "sourceFile",
    }
  }

  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
