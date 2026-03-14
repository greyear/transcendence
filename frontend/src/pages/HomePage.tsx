import { Filter, Plus } from "iconoir-react";
import { FavoriteButton } from "../components/buttons/FavoriteButton";
import { MainButton } from "../components/buttons/MainButton";
import { ModerationButton } from "../components/buttons/ModerationButton";
import { TextIconButton } from "../components/buttons/TextIconButton";
import { RecipeCard } from "../components/cards/RecipeCard";
import { UserCard } from "../components/cards/UserCard";
import { SelectField } from "../components/inputs/SelectField";

export const HomePage = () => {
	return (
		<>
			<h1>Home</h1>
			 <SelectField defaultValue="tbsp">
                                <option value="tbsp">tbsp</option>
                                <option value="g">g</option>
                                <option value="ml">ml</option>
                                <option value="longer value">longer value</option>
                        </SelectField>
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
