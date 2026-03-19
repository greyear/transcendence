import { Filter, Plus } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { FavoriteButton } from "../components/buttons/FavoriteButton";
import { IconButton } from "../components/buttons/IconButton";
import { MainButton } from "../components/buttons/MainButton";
import { ModerationButton } from "../components/buttons/ModerationButton";
import { TextIconButton } from "../components/buttons/TextIconButton";
import { RecipeCard } from "../components/cards/RecipeCard";
import { UserCard } from "../components/cards/UserCard";
import { SelectField } from "../components/inputs/SelectField";
import { InputField } from "../components/inputs/InputField";
import { LanguageSelector } from "../components/LanguageSelector";

const HomePage = () => {
	const { t } = useTranslation();

	return (
		<>
			<h1>{t("homePage.title")}</h1>
			<LanguageSelector isHeader={false} />
			<SelectField
				inputId="ingredients"
				placeholder="Select one"
				options={[
					{ label: "Tomato", value: "tomato" },
					{ label: "Garlic", value: "garlic" },
					{ label: "Onion", value: "onion" },
				]}
			<InputField
				id="email"
				label="Email"
				type="email"
				placeholder="Enter your email"
				required
				hint="We’ll never share your email."
			/>
			<InputField
				id="password-own-error"
				label="Password"
				type="password"
				required
				minLength={8}
				hint="Password must include at least 8 characters."
				error="Password too short!"
			/>
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

export default HomePage;
