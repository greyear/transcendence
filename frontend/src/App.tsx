import { FavoriteButton } from "./components/buttons/FavoriteButton";
import { ModerationButton } from "./components/buttons/ModerationButton";
import { RecipeCard } from "./components/cards/RecipeCard";

function App() {
	return (
		<>
		<RecipeCard />
		<FavoriteButton />
		<ModerationButton action="approve" />
		<ModerationButton action="discard" />
	</>);
}

export default App
