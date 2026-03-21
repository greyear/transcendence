import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";

// TODO: add count for pagination
// type RecipesGridProps = {
// 	count?: string;
// };

type RecipeCardResponse = {
	id: number;
	title: string;
	description: string;
	rating_avg: string;
};

export const RecipesGrid = async () => {
	const getRecipeList = async (): Promise<RecipeCardResponse[]> => {
		try {
			const res = await fetch("http://localhost:3000/recipes");
			if (!res.ok) {
				console.log("The recipe database is empty.");
				return [];
			}
			const body = await res.json();
			return body.data;
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	const recipeList: RecipeCardResponse[] = (await getRecipeList()) || [];

	return (
		<ul className="recipe-card-list">
			{recipeList.map(({ id, title, description, rating_avg }) => (
				<li key={id}>
					<RecipeCard
						id={id}
						title={title}
						description={description}
						rating={rating_avg}
					/>
				</li>
			))}
		</ul>
	);
};
