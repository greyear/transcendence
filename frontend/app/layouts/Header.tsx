import { Bell, Menu, Xmark } from "iconoir-react";
import { useState } from "react";
import { IconButton } from "../components/buttons/IconButton";
import { MainButton } from "../components/buttons/MainButton";
import "../assets/styles/header.css";
import { Link } from "react-router";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { LanguageSelector } from "~/components/LanguageSelector";

export const Header = () => {
	const [isOpen, setIsOpen] = useState(false);

	const handleMenuButtonClick = () => setIsOpen((prev) => !prev);

	return (
		<header className="main-header">
			<div className="header-top-row">
				<Link to="/" aria-label="RCP – go to homepage" className="logo-link h2">
					RCP
				</Link>
				<div className="header-top-icon-row">
					<IconButton aria-label="Notifications">
						<Bell />
					</IconButton>
					<IconButton
						onClick={handleMenuButtonClick}
						aria-expanded={isOpen}
						aria-label="Toggle menu"
					>
						{isOpen ? <Xmark /> : <Menu />}
					</IconButton>
				</div>
			</div>
			{isOpen && (
				<>
					<nav aria-label="Main">
						<ul className="header-navigation-list">
							<li>
								<TextIconButton size="body2" to="/" variant="inverted">
									Home
								</TextIconButton>
							</li>
							<li>
								<TextIconButton size="body2" to="/recipes" variant="inverted">
									Recipes
								</TextIconButton>
							</li>
							<li>
								<TextIconButton size="body2" to="/users" variant="inverted">
									People
								</TextIconButton>
							</li>
							<li>
								<MainButton variant="inverted">Log in/Sign Up</MainButton>
							</li>
						</ul>
					</nav>
					{/* Searchbar */}
					<LanguageSelector isHeader />
				</>
			)}
		</header>
	);
};
