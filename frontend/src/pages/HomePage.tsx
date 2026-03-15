import { Filter, Plus } from "iconoir-react";
import { FavoriteButton } from "../components/buttons/FavoriteButton";
import { MainButton } from "../components/buttons/MainButton";
import { ModerationButton } from "../components/buttons/ModerationButton";
import { TextIconButton } from "../components/buttons/TextIconButton";
import { RecipeCard } from "../components/cards/RecipeCard";
import { UserCard } from "../components/cards/UserCard";
import { InputField } from "../components/inputs/InputField";

export const HomePage = () => {
	return (
		<>
			<h1>Home</h1>
			<InputField />
			<InputField placeholder="Username" />
			<InputField id="password" type="password" placeholder="Password" />

			<InputField
				id="password-rules"
				label="Password"
				type="password"
				placeholder="Password"
				hint="Password must include at least 8 characters."
			/>
			<InputField
				id="password-rules"
				label="Password"
				type="password"
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
		</>
	);
};
