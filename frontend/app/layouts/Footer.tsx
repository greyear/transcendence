import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { LanguageSelector } from "~/components/LanguageSelector";
import "../assets/styles/footer.css";

export const Footer = () => {
	return (
		<footer className="footer">
			<nav aria-label="Main">
				<ul className="nav-list">
					<li>
						<TextIconButton size="body2" to="/">
							Home
						</TextIconButton>
					</li>
					<li>
						<TextIconButton size="body2" to="/recipes">
							Recipes
						</TextIconButton>
					</li>
					<li>
						<TextIconButton size="body2" to="/users">
							People
						</TextIconButton>
					</li>
				</ul>
			</nav>
			{/* TODO: add the login state */}
			<MainButton>Log In/Sign up</MainButton>
			<LanguageSelector isHeader={false} />
			<div className="divider-line" aria-hidden="true" />
			<div className="legal-container">
				<nav aria-label="Legal">
					<ul className="nav-list nav-list-divider">
						<li>
							<TextIconButton size="body2" to="/terms">
								Terms and Conditions
							</TextIconButton>
						</li>
						<li>
							<TextIconButton size="body2" to="/policy">
								Privacy Policy
							</TextIconButton>
						</li>
					</ul>
				</nav>
				<small className="copyright">Transcendence, Hive © 2026</small>
			</div>
		</footer>
	);
};
