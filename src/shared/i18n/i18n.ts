import * as Localization from "expo-localization"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import deAuth from "./de/auth.json"
import deCommon from "./de/common.json"
import deEditCard from "./de/editCard.json"
import deReviewPrep from "./de/reviewPrep.json"
import deReviewSession from "./de/reviewSession.json"
import deSettings from "./de/settings.json"
import deTabs from "./de/tabs.json"
import enAuth from "./en/auth.json"
import enCommon from "./en/common.json"
import enEditCard from "./en/editCard.json"
import enReviewPrep from "./en/reviewPrep.json"
import enReviewSession from "./en/reviewSession.json"
import enSettings from "./en/settings.json"
import enTabs from "./en/tabs.json"

const resources = {
  de: {
    auth: deAuth,
    common: deCommon,
    editCard: deEditCard,
    reviewPrep: deReviewPrep,
    reviewSession: deReviewSession,
    settings: deSettings,
    tabs: deTabs,
  },
  en: {
    auth: enAuth,
    common: enCommon,
    editCard: enEditCard,
    reviewPrep: enReviewPrep,
    reviewSession: enReviewSession,
    settings: enSettings,
    tabs: enTabs,
  },
} as const

const lang = (Localization.getLocales()[0].languageCode ?? "en").toLowerCase()

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: resources[lang as keyof typeof resources] ? lang : "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: Object.keys(resources.en),
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
