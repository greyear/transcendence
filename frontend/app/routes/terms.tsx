import { useTranslation } from "react-i18next";
import "~/assets/styles/legal.css";

const TermsPage = () => {
	const { t } = useTranslation();

	return (
		<article className="legal-page" aria-labelledby="terms-heading">
			<header className="legal-page-header">
				<h1 id="terms-heading">{t("termsPage.title")}</h1>
				<p className="legal-page-last-updated text-caption">
					{t("termsPage.lastUpdated")}
				</p>
			</header>

			<p className="legal-page-intro">{t("termsPage.intro")}</p>

			<section
				className="legal-page-section"
				aria-labelledby="terms-acceptance"
			>
				<h2 id="terms-acceptance">{t("termsPage.acceptanceTitle")}</h2>
				<p>{t("termsPage.acceptanceText")}</p>
			</section>

			<section className="legal-page-section" aria-labelledby="terms-use">
				<h2 id="terms-use">{t("termsPage.useTitle")}</h2>
				<p>{t("termsPage.useText")}</p>
			</section>

			<section className="legal-page-section" aria-labelledby="terms-content">
				<h2 id="terms-content">{t("termsPage.contentTitle")}</h2>
				<p>{t("termsPage.contentText")}</p>
			</section>

			<section
				className="legal-page-section"
				aria-labelledby="terms-prohibited"
			>
				<h2 id="terms-prohibited">{t("termsPage.prohibitedTitle")}</h2>
				<ul className="legal-page-list">
					<li>{t("termsPage.prohibited1")}</li>
					<li>{t("termsPage.prohibited2")}</li>
					<li>{t("termsPage.prohibited3")}</li>
					<li>{t("termsPage.prohibited4")}</li>
				</ul>
			</section>

			<section
				className="legal-page-section"
				aria-labelledby="terms-termination"
			>
				<h2 id="terms-termination">{t("termsPage.terminationTitle")}</h2>
				<p>{t("termsPage.terminationText")}</p>
			</section>

			<section className="legal-page-section" aria-labelledby="terms-liability">
				<h2 id="terms-liability">{t("termsPage.liabilityTitle")}</h2>
				<p>{t("termsPage.liabilityText")}</p>
			</section>

			<section className="legal-page-section" aria-labelledby="terms-changes">
				<h2 id="terms-changes">{t("termsPage.changesTitle")}</h2>
				<p>{t("termsPage.changesText")}</p>
			</section>

			<section className="legal-page-section" aria-labelledby="terms-contact">
				<h2 id="terms-contact">{t("termsPage.contactTitle")}</h2>
				<p>{t("termsPage.contactText")}</p>
			</section>
		</article>
	);
};

export default TermsPage;
