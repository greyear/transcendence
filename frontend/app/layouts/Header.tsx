import { Bell, Menu, Xmark } from "iconoir-react";
import { useEffect, useState } from "react";
import { IconButton } from "../components/buttons/IconButton";
import { MainButton } from "../components/buttons/MainButton";
import "../assets/styles/header.css";
import { Link } from "react-router";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { SearchField } from "~/components/inputs/SearchField";
import { LanguageSelector } from "~/components/LanguageSelector";
import { useScreenSize } from "~/composables/useScreenSize";

const NavigationList = () => {
	return (
		<nav aria-label="Header main">
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
			</ul>
		</nav>
	);
};

export const Header = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { screenSize } = useScreenSize();

	const handleMenuButtonClick = () => setIsOpen((prev) => !prev);

	const isDesktop = screenSize === "desktop";
	const isMobile = screenSize === "mobile";

	useEffect(() => {
		if (screenSize === "desktop") {
			setIsOpen(false);
		}
	}, [screenSize]);

	return (
		<header className="main-header">
			<div className="header-top-row">
				<Link to="/" aria-label="RCP – go to homepage" className="logo-link h2">
					RCP
				</Link>
				<div className="header-top-icon-row">
					{!isMobile && (
						<SearchField mode={isDesktop ? "always-open" : "collapsible"} />
					)}
					<IconButton aria-label="Notifications">
						<Bell />
					</IconButton>
					{!isDesktop ? (
						<IconButton
							onClick={handleMenuButtonClick}
							aria-expanded={isOpen}
							aria-label="Toggle menu"
						>
							{isOpen ? <Xmark /> : <Menu />}
						</IconButton>
					) : (
						<MainButton variant="inverted">Sign Up</MainButton>
					)}
				</div>
			</div>
			{isOpen && !isDesktop && (
				<>
					<NavigationList />
					<MainButton variant="inverted">Log in/Sign Up</MainButton>
					<LanguageSelector isHeader />
				</>
			)}
			{isDesktop && (
				<div className="header-bottom-row">
					<NavigationList />
					<LanguageSelector isHeader />
				</div>
			)}
		</header>
	);
};
