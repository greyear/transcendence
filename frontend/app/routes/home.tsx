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
		<section className="home-page">
			<div
				className="home-page-hero"
				style={{ backgroundImage: `url(${heroImage})` }}
			>
				<div className="home-page-hero-overlay">
					<h1>{t("homePage.heroTitle")}</h1>
					<p className="text-caption">{t("homePage.heroDescription")}</p>
				</div>
			</div>

			<div className="home-page-recipe-header">
				<h2>{t("homePage.topRecipes")}</h2>
				<TextIconButton to="/recipes" className="text-body2">
					{t("homePage.all")}
					<NavArrowRight />
				</TextIconButton>
			</div>

			<RecipesGrid sort="top" page={1} perPage={recipesPerPage} />

			<div className="home-page-cooks-header">
				<h2>{t("homePage.followCooks")}</h2>
				<TextIconButton to="/users" className="text-body2">
					{t("homePage.all")}
					<NavArrowRight />
				</TextIconButton>
			</div>

			<CooksRow />
		</section>
	);
};

export default HomePage;
