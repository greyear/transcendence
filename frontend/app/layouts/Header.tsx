import { Menu, ProfileCircle, Xmark } from "iconoir-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "../components/buttons/IconButton";
import { MainButton } from "../components/buttons/MainButton";
import "../assets/styles/header.css";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { SearchField } from "~/components/inputs/SearchField";
import { LanguageSelector } from "~/components/LanguageSelector";
import { handleDropdownClose } from "~/composables/closeDropdownHandler";
import { useScreenSize } from "~/composables/useScreenSize";

type NavigationListProps = {
	isAuthenticated: boolean;
};

const NavigationList = ({ isAuthenticated }: NavigationListProps) => {
	const { t } = useTranslation();
	const { pathname } = useLocation();
	const { screenSize } = useScreenSize();

	const isDesktop = screenSize === "desktop";

	return (
		<nav aria-label={t("ariaLabels.headerMain")}>
			<ul className="header-navigation-list">
				<li>
					<TextIconButton
						size="body3"
						to="/"
						variant="inverted"
						selected={pathname === "/"}
					>
						{t("layout.home")}
					</TextIconButton>
				</li>
				<li>
					<TextIconButton
						size="body3"
						to="/recipes"
						variant="inverted"
						selected={pathname.startsWith("/recipes")}
					>
						{t("layout.recipes")}
					</TextIconButton>
				</li>
				<li>
					<TextIconButton
						size="body3"
						to="/users"
						variant="inverted"
						selected={pathname.startsWith("/users")}
					>
						{t("layout.users")}
					</TextIconButton>
				</li>
				{isAuthenticated && !isDesktop && (
					<li>
						<TextIconButton
							size="body3"
							to="/profile"
							variant="inverted"
							selected={pathname.startsWith("/profile")}
						>
							{t("layout.profile")}
						</TextIconButton>
					</li>
				)}
			</ul>
		</nav>
	);
};

type HeaderProps = {
	isAuthenticated: boolean;
	onOpenAuthModal: () => void;
};

export const Header = ({ isAuthenticated, onOpenAuthModal }: HeaderProps) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const { screenSize } = useScreenSize();
	const headerRef = useRef<HTMLElement>(null);
	const { pathname } = useLocation();

	const navigate = useNavigate();
	const handleMenuButtonClick = () => setIsOpen((prev) => !prev);
	const handleSearch = (query: string) =>
		navigate(`/search?q=${encodeURIComponent(query)}`);

	const isDesktop = screenSize === "desktop";
	const isMobile = screenSize === "mobile";

	useEffect(() => {
		if (screenSize === "desktop") {
			setIsOpen(false);
		}
	}, [screenSize]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is an intentional trigger, not a value used inside the effect
	useEffect(() => {
		setIsOpen(false);
	}, [pathname]);

	useEffect(() => {
		const header = headerRef.current;
		if (!header) {
			return;
		}
		return handleDropdownClose(header, setIsOpen);
	}, []);

	return (
		<header ref={headerRef} className="main-header">
			<div className="header-top-row">
				<Link
					to="/"
					aria-label={`RCP – ${t("ariaLabels.goHome")}`}
					className="logo-link h3"
				>
					RCP
				</Link>
				{isDesktop && <NavigationList isAuthenticated={isAuthenticated} />}
				<div className="header-top-icon-row">
					{!isMobile && (
						<SearchField
							className="header-search"
							mode={isDesktop ? "always-open" : "collapsible"}
							placeholder={t("common.searchPlaceholder")}
							onSubmit={handleSearch}
						/>
					)}
					{!isDesktop ? (
						<IconButton
							onClick={handleMenuButtonClick}
							aria-expanded={isOpen}
							aria-label={t("ariaLabels.toggleMenu")}
							variant="transparent"
						>
							{isOpen ? <Xmark /> : <Menu />}
						</IconButton>
					) : (
						<>
							<LanguageSelector isHeader variant="dropdown" />
							{isAuthenticated ? (
								<IconButton
									className="profile-button"
									to="/profile"
									aria-label={t("ariaLabels.toProfilePage")}
								>
									<ProfileCircle />
								</IconButton>
							) : (
								<MainButton variant="inverted" onClick={onOpenAuthModal}>
									{t("common.signInButton")}
								</MainButton>
							)}
						</>
					)}
				</div>
			</div>
			{isOpen && !isDesktop && (
				<div className="header-menu-overlay">
					<NavigationList isAuthenticated={isAuthenticated} />
					{!isAuthenticated && (
						<MainButton variant="inverted" onClick={onOpenAuthModal}>
							{t("common.signInButton")}
						</MainButton>
					)}
					{isMobile && (
						<SearchField
							placeholder={t("common.searchPlaceholder")}
							onSubmit={handleSearch}
						/>
					)}
					<LanguageSelector isHeader />
				</div>
			)}
		</header>
	);
};
