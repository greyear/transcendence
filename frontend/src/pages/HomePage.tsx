import { Filter, Plus } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { FavoriteButton } from "../components/buttons/FavoriteButton";
import { IconButton } from "../components/buttons/IconButton";
import { MainButton } from "../components/buttons/MainButton";
import { ModerationButton } from "../components/buttons/ModerationButton";
import { TextIconButton } from "../components/buttons/TextIconButton";
import { RecipeCard } from "../components/cards/RecipeCard";
import { UserCard } from "../components/cards/UserCard";
import { InputField } from "../components/inputs/InputField";
import { LanguageSelector } from "../components/LanguageSelector";

export const HomePage = () => {
	const { t } = useTranslation();

	return (
		<>
			<h1>Home</h1>
			<InputField />
			<InputField placeholder="Username" />
			<InputField id="password" type="password" placeholder="Password" />

			<InputField
				id="password-rules-hint"
				label="Password"
				type="password"
				placeholder="Password"
				hint="Password must include at least 8 characters."
			/>
			<InputField
				id="password-rules-error"
				label="Password"
				type="password"
				error="Password too short!"
			/>
			<h1>{t("homePage.title")}</h1>
			<LanguageSelector isHeader={false} />
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
			<div>
				<IconButton>
					<Filter />
				</IconButton>
			</div>
		</>
	);
};
