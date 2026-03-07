import { FavoriteButton } from "./components/buttons/FavoriteButton";
import { ModerationButton } from "./components/buttons/ModerationButton";
import { RecipeCard } from "./components/cards/RecipeCard";
import { Plus } from "iconoir-react";
import { MainButton } from "./components/buttons/MainButton";

function App() {
	return (
		<>
			<RecipeCard />
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
