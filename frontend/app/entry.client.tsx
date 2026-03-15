import i18n from "i18next";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import i18nConfig from "./i18n";
import resources from "./locales";

const main = async () => {
  await i18n
    .use(initReactI18next)
    .init({
      ...i18nConfig,
      lng: document.documentElement.lang,
      resources,
      detection: {
        order: ["cookie", "localStorage", "htmlTag"],
        caches: ["cookie"],
        lookupCookie: "i18next"
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <I18nextProvider i18n={i18n}>
          <HydratedRouter />
        </I18nextProvider>
      </StrictMode>,
    );
  });
};

main().catch((error) => console.error(error));
