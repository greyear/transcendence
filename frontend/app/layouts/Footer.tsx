import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { LanguageSelector } from "~/components/LanguageSelector";
import "../assets/styles/footer.css";
import { useTranslation } from "react-i18next";

type FooterProps = {
	onOpenAuthModal: () => void;
};

export const Footer = ({ onOpenAuthModal }: FooterProps) => {
	const { t } = useTranslation();

	return (
		<footer className="footer">
			<div className="footer-top-row">
				<nav aria-label={t("ariaLabels.footerMain")}>
					<ul className="nav-list">
						<li>
							<TextIconButton size="body2" to="/">
								{t("layout.home")}
							</TextIconButton>
						</li>
						<li>
							<TextIconButton size="body2" to="/recipes">
								{t("layout.recipes")}
							</TextIconButton>
						</li>
						<li>
							<TextIconButton size="body2" to="/users">
								{t("layout.users")}
							</TextIconButton>
						</li>
					</ul>
				</nav>
				<div className="footer-buttons-row">
					<MainButton onClick={onOpenAuthModal}>
						{t("common.signInButton")}
					</MainButton>
					<LanguageSelector isHeader={false} />
				</div>
			</div>
			<div className="divider-line" aria-hidden="true" />
			<div className="legal-container">
				<nav aria-label={t("ariaLabels.legal")}>
					<ul className="nav-list nav-list-legal">
						<li>
							<TextIconButton size="body2" to="/terms">
								{t("layout.terms")}
							</TextIconButton>
						</li>
						<li>
							<TextIconButton size="body2" to="/policy">
								{t("layout.policy")}
							</TextIconButton>
						</li>
					</ul>
				</nav>
				<small className="copyright">Transcendence, Hive © 2026</small>
			</div>
		</footer>
	);
};
