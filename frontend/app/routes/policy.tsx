import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "~/composables/useDocumentTitle";
import i18next from "~/i18next.server";
import "~/assets/styles/legal.scss";
import type { Route } from "./+types/policy";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const t = await i18next.getFixedT(request);
	return {
		meta: {
			title: t("pageTitles.privacy"),
			description: t("pageDescriptions.privacy"),
		},
	};
};

export const meta: Route.MetaFunction = ({ data }) => [
	{ title: data?.meta.title },
	{ name: "description", content: data?.meta.description },
];

const PrivacyPolicyPage = () => {
	const { t } = useTranslation();
	useDocumentTitle(t("pageTitles.privacy"));

	return (
		<article className="legal-page" aria-labelledby="privacy-heading">
			<header className="legal-page-header">
				<h1 id="privacy-heading">{t("privacyPage.title")}</h1>
				<p className="legal-page-last-updated text-caption">
					{t("privacyPage.lastUpdated")}
				</p>
			</header>

			<p className="legal-page-intro">{t("privacyPage.intro")}</p>

			<section className="legal-page-section" aria-labelledby="privacy-collect">
				<h2 id="privacy-collect">{t("privacyPage.collectTitle")}</h2>
				<ul className="legal-page-list">
					<li>{t("privacyPage.collectAccount")}</li>
					<li>{t("privacyPage.collectUsage")}</li>
					<li>{t("privacyPage.collectCookies")}</li>
				</ul>
			</section>

			<section className="legal-page-section" aria-labelledby="privacy-use">
				<h2 id="privacy-use">{t("privacyPage.useTitle")}</h2>
				<ul className="legal-page-list">
					<li>{t("privacyPage.useProvide")}</li>
					<li>{t("privacyPage.useAuth")}</li>
					<li>{t("privacyPage.usePrefs")}</li>
				</ul>
			</section>

			<section className="legal-page-section" aria-labelledby="privacy-share">
				<h2 id="privacy-share">{t("privacyPage.shareTitle")}</h2>
				<p>{t("privacyPage.shareText")}</p>
			</section>

			<section
				className="legal-page-section"
				aria-labelledby="privacy-security"
			>
				<h2 id="privacy-security">{t("privacyPage.securityTitle")}</h2>
				<p>{t("privacyPage.securityText")}</p>
			</section>

			<section className="legal-page-section" aria-labelledby="privacy-cookies">
				<h2 id="privacy-cookies">{t("privacyPage.cookiesTitle")}</h2>
				<p>{t("privacyPage.cookiesText")}</p>
			</section>

			<section className="legal-page-section" aria-labelledby="privacy-rights">
				<h2 id="privacy-rights">{t("privacyPage.rightsTitle")}</h2>
				<p>{t("privacyPage.rightsText")}</p>
			</section>

			<section className="legal-page-section" aria-labelledby="privacy-contact">
				<h2 id="privacy-contact">{t("privacyPage.contactTitle")}</h2>
				<p>{t("privacyPage.contactText")}</p>
			</section>
		</article>
	);
};

export default PrivacyPolicyPage;
