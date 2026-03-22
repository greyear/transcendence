import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";
import { useEffect, useState } from "react";

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

export const RecipesGrid = () => {
	const [recipeList, setRecipeList] = useState<RecipeCardResponse[]>([]);

	useEffect(() => {
		fetch("http://localhost:3000/recipes")
			.then((res) => {
				if (!res.ok) {
					console.log("The recipe database is empty.");
					return { data: [] };
				}
				return res.json();
			})
			.then((body) => setRecipeList(body.data))
			.catch(console.error);
	}, []);

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
