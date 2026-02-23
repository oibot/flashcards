import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as Localization from "expo-localization"

import enCommon from "./en/common.json"
import deCommon from "./de/common.json"

const resources = {
  en: { common: enCommon },
  de: { common: deCommon },
} as const

const lang = (Localization.getLocales()[0].languageCode ?? "en").toLowerCase()

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: resources[lang as keyof typeof resources] ? lang : "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common"],
  interpolation: {
    escapeValue: false,
  },
  keySeparator: false,
})

export default i18n
