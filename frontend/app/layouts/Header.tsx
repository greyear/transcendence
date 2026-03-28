import { Bell, Menu, Xmark } from "iconoir-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "../components/buttons/IconButton";
import { MainButton } from "../components/buttons/MainButton";
import "../assets/styles/header.css";
import { Link, useLocation } from "react-router";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { SearchField } from "~/components/inputs/SearchField";
import { LanguageSelector } from "~/components/LanguageSelector";
import { handleDropdowClose } from "~/composables/closeDropdownHandler";
import { useScreenSize } from "~/composables/useScreenSize";

const NavigationList = () => {
	const { pathname } = useLocation();

	return (
		<nav aria-label="Header main">
			<ul className="header-navigation-list">
				<li>
					<TextIconButton
						size="body3"
						to="/"
						variant="inverted"
						selected={pathname === "/"}
					>
						Home
					</TextIconButton>
				</li>
				<li>
					<TextIconButton
						size="body3"
						to="/recipes"
						variant="inverted"
						selected={pathname.startsWith("/recipes")}
					>
						Recipes
					</TextIconButton>
				</li>
				<li>
					<TextIconButton
						size="body3"
						to="/users"
						variant="inverted"
						selected={pathname.startsWith("/users")}
					>
						People
					</TextIconButton>
				</li>
			</ul>
		</nav>
	);
};

// TODO: add the login state
export const Header = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { screenSize } = useScreenSize();
	const headerRef = useRef<HTMLElement>(null);

	const handleMenuButtonClick = () => setIsOpen((prev) => !prev);

	const isDesktop = screenSize === "desktop";
	const isMobile = screenSize === "mobile";

	useEffect(() => {
		if (screenSize === "desktop") {
			setIsOpen(false);
		}
	}, [screenSize]);

	useEffect(() => {
		const header = headerRef.current;

		if (!header) {
			return;
		}

		handleDropdowClose(header, setIsOpen);
	}, []);

	return (
		<header ref={headerRef} className="main-header">
			<div className="header-top-row">
				<Link to="/" aria-label="RCP – go to homepage" className="logo-link h3">
					RCP
				</Link>
				{isDesktop && <NavigationList />}
				<div className="header-top-icon-row">
					{!isMobile && (
						<SearchField mode={isDesktop ? "always-open" : "collapsible"} />
					)}
					<IconButton aria-label="Notifications" variant="transparent">
						<Bell />
					</IconButton>
					{!isDesktop ? (
						<IconButton
							onClick={handleMenuButtonClick}
							aria-expanded={isOpen}
							aria-label="Toggle menu"
							variant="transparent"
						>
							{isOpen ? <Xmark /> : <Menu />}
						</IconButton>
					) : (
						<>
							<LanguageSelector isHeader variant="dropdown" />
							<MainButton variant="inverted">Sign In</MainButton>
						</>
					)}
				</div>
			</div>
			{isOpen && !isDesktop && (
				<div className="header-menu-overlay">
					<NavigationList />
					<MainButton variant="inverted">Sign In</MainButton>
					{isMobile && <SearchField placeholder="Search for..." />}
					<LanguageSelector isHeader />
				</div>
			)}
		</header>
	);
};
