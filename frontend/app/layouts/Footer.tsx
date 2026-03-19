import { MainButton } from "~/components/buttons/MainButton"
import { TextIconButton } from "~/components/buttons/TextIconButton"
import { LanguageSelector } from "~/components/LanguageSelector"

export const Footer = () => {
	return (
		<footer>
			<nav aria-label="Main">
				<ul>
					<li><TextIconButton to="/">Home</TextIconButton></li>
					<li><TextIconButton to="/recipes">Recipes</TextIconButton></li>
					<li><TextIconButton to="/users">People</TextIconButton></li>
				</ul>
			</nav>
			{/* TODO: add the login state */}
			<MainButton>Log In/Sign up</MainButton>
			<LanguageSelector isHeader={false} />
			<div className="divider-line" aria-hidden="true" />
			<div>
				<nav aria-label="Legal">
					<ul>
						<li><TextIconButton to="/terms">Terms and Conditions</TextIconButton></li>
						<li><span aria-hidden="true">|</span></li> {/* Move it to css */}
						<li><TextIconButton to="/policy">Privacy Policy</TextIconButton></li>
					</ul>
				</nav>
				<small>Transcendence, Hive © 2026</small>
			</div>
		</footer>
	)
}
