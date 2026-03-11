import { RecipeCard } from "../components/cards/RecipeCard";
import { UserCard } from "../components/cards/UserCard"
import { FavoriteButton } from "../components/buttons/FavoriteButton";
import { ModerationButton } from "../components/buttons/ModerationButton";
import { MainButton } from "../components/buttons/MainButton";
import { Plus } from "iconoir-react";

export const HomePage = () => {
	return (
		<>
			<h1>Home</h1>
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
		</>
	);
};
