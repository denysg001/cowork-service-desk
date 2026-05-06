import i18n from "i18next";
import { initReactI18next } from "react-i18next";

void i18n.use(initReactI18next).init({
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  resources: {
    "pt-BR": {
      translation: {
        title: "Coworking Service Desk",
        tickets: "Tickets",
        dashboard: "Operação",
        login: "Entrar"
      }
    }
  },
  interpolation: { escapeValue: false }
});

export default i18n;
