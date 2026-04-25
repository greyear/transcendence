import { useTranslation } from "react-i18next";
import notFoundImage from "~/assets/images/404-not-found.png";
import { MainButton } from "~/components/buttons/MainButton";
import "../assets/styles/not-found.css";

export const NotFoundView = () => {
	const { t } = useTranslation();

	return (
		<section className="not-found-page" aria-labelledby="not-found-title">
			<img
				className="not-found-page-image"
				src={notFoundImage}
				alt={t("notFoundPage.imageAlt")}
			/>
			<div className="not-found-page-content">
				<h1 id="not-found-title" className="not-found-page-title">
					<span>{t("notFoundPage.titleLine1")}</span>
					<span>{t("notFoundPage.titleLine2")}</span>
				</h1>
				<MainButton to="/" variant="primary" className="not-found-page-button">
					{t("notFoundPage.backHome")}
				</MainButton>
			</div>
		</section>
	);
};
