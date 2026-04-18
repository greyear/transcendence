import { useRef, useState } from "react";
import { IconButton } from "~/components/buttons/IconButton";
import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { CooksRow, type CooksRowHandle } from "~/components/CooksRow";
import { RecipesGrid } from "~/components/RecipesGrid";
import { useScreenSize } from "~/composables/useScreenSize";
import "../assets/styles/home.css";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import heroImage from "~/assets/images/hero-image.jpg";
import type { LayoutOutletContext } from "~/layouts/layout";

const HomePage = () => {
	const { t } = useTranslation();
	const { screenSize } = useScreenSize();
	const { isAuthenticated, openAuthModal } =
		useOutletContext<LayoutOutletContext>();
	const recipesPerPage = screenSize === "mobile" ? 4 : 6;
	const cooksRowRef = useRef<CooksRowHandle | null>(null);
	const [cooksRowState, setCooksRowState] = useState({
		canScrollLeft: false,
		canScrollRight: false,
	});

	return (
		<section className="home-page" aria-labelledby="hero-heading">
			<header
				className="home-page-hero"
				style={{ backgroundImage: `url(${heroImage})` }}
			>
				<div className="home-page-hero-overlay">
					<h1 id="hero-heading">{t("homePage.heroTitle")}</h1>
					<p className="text-caption">{t("homePage.heroDescription")}</p>
				</div>
			</header>

			<MainButton className="home-page-view-button text-label" to="/recipes">
				{t("homePage.viewAllRecipes")}
			</MainButton>

			<section
				className="home-page-recipes-section"
				aria-labelledby="top-recipes-heading"
			>
				<div className="home-page-recipe-header">
					<h2 id="top-recipes-heading">{t("homePage.topRecipes")}</h2>
					<TextIconButton
						to="/recipes"
						className="text-body2"
						aria-label={t("ariaLabels.allRecipes")}
					>
						{t("homePage.all")}
						<NavArrowRight aria-hidden="true" />
					</TextIconButton>
				</div>
				<RecipesGrid
					sort="top"
					sortValue=""
					page={1}
					perPage={recipesPerPage}
					isAuthenticated={isAuthenticated}
					openAuthModal={openAuthModal}
				/>
			</section>

			<section
				className="home-page-cooks-section"
				aria-labelledby="cooks-heading"
			>
				<div className="home-page-cooks-header">
					<h2 id="cooks-heading">{t("homePage.followCooks")}</h2>
					<div className="home-page-cooks-actions">
						<TextIconButton
							to="/users"
							className="text-body2"
							aria-label={t("ariaLabels.allUsers")}
						>
							{t("homePage.all")}
							<NavArrowRight aria-hidden="true" />
						</TextIconButton>
						{screenSize !== "mobile" ? (
							<div className="home-page-cooks-scroll-controls">
								<IconButton
									aria-label={t("ariaLabels.scrollCooksLeft")}
									onClick={() => cooksRowRef.current?.scrollLeft()}
									disabled={!cooksRowState.canScrollLeft}
								>
									<NavArrowLeft aria-hidden="true" />
								</IconButton>
								<IconButton
									aria-label={t("ariaLabels.scrollCooksRight")}
									onClick={() => cooksRowRef.current?.scrollRight()}
									disabled={!cooksRowState.canScrollRight}
								>
									<NavArrowRight aria-hidden="true" />
								</IconButton>
							</div>
						) : null}
					</div>
				</div>
				<CooksRow ref={cooksRowRef} onScrollStateChange={setCooksRowState} />
			</section>
		</section>
	);
};

export default HomePage;
