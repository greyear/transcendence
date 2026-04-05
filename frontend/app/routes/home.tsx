import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { CooksRow } from "~/components/CooksRow";
import { RecipesGrid } from "~/components/RecipesGrid";
import { useScreenSize } from "~/composables/useScreenSize";
import "../assets/styles/home.css";
import { NavArrowRight } from "iconoir-react";
import { useTranslation } from "react-i18next";
import heroImage from "~/assets/images/hero-image.jpg";

const HomePage = () => {
	const { t } = useTranslation();
	const { screenSize } = useScreenSize();
	const recipesPerPage = screenSize === "mobile" ? 4 : 6;

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
				<RecipesGrid sort="top" page={1} perPage={recipesPerPage} />
			</section>

			<section
				className="home-page-cooks-section"
				aria-labelledby="cooks-heading"
			>
				<div className="home-page-cooks-header">
					<h2 id="cooks-heading">{t("homePage.followCooks")}</h2>
					<TextIconButton
						to="/users"
						className="text-body2"
						aria-label={t("ariaLabels.allUsers")}
					>
						{t("homePage.all")}
						<NavArrowRight aria-hidden="true" />
					</TextIconButton>
				</div>
				<CooksRow />
			</section>
		</section>
	);
};

export default HomePage;
