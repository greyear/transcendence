import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";

// TODO: add count for pagination
// type RecipesGridProps = {
// 	count?: string;
// };

export const RecipesGrid = () => {
	const recipeList = [
		{ id: 1, title: "Pasta", description: "Tasty pasta" },
		{ id: 2, title: "Soup", description: "Traditional salmon soup" },
		{ id: 3, title: "Cake", description: "Crispy chocolate cake" },
	];

	return (
		<ul className="recipe-card-list">
			{recipeList.map(({ id, title, description }) => (
				<li key={id}>
					<RecipeCard
						id={id}
						title={title}
						description={description}
						rating={3.5}
					/>
				</li>
			))}
		</ul>
	);
};
