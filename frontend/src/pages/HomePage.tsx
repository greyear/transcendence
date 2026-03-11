import { Filter, Plus } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { FavoriteButton } from "../components/buttons/FavoriteButton";
import { MainButton } from "../components/buttons/MainButton";
import { ModerationButton } from "../components/buttons/ModerationButton";
import { RecipeCard } from "../components/cards/RecipeCard";
import { UserCard } from "../components/cards/UserCard";
import { TextIconButton } from "../components/buttons/TextIconButton";

export const HomePage = () => {
	const { t } = useTranslation();

	return (
		<>
			<h1>{t("homePage.title")}</h1>
			<RecipeCard />
			<UserCard />
			<FavoriteButton />
			<ModerationButton action="approve" />
			<ModerationButton action="discard" />

			<FavoriteButton disabled />
			<ModerationButton action="discard" disabled />
			<MainButton>
				<Plus />
				Create new
			</MainButton>
			<MainButton>Log in/sign up</MainButton>
			<MainButton disabled>Disabled</MainButton>
			<TextIconButton>
				Filter
				<Filter />
			</TextIconButton>
			<TextIconButton to="recipes">All recipes</TextIconButton>
		</>
	);
};
