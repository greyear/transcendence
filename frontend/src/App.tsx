import { Plus } from "iconoir-react";
import { FavoriteButton } from "./components/buttons/FavoriteButton";
import { MainButton } from "./components/buttons/MainButton";
import { ModerationButton } from "./components/buttons/ModerationButton";
import { RecipeCard } from "./components/cards/RecipeCard";
import { UserCard } from "./components/cards/UserCard";

function App() {
	return (
		<>
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
}

export default App;
