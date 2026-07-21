export const featureFlags = {
  audioCreation: process.env.EXPO_PUBLIC_FEATURE_AUDIO_CREATION === "true",
} as const
