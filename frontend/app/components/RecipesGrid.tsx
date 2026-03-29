import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";
import { useEffect, useState } from "react";

type RecipeCardResponse = {
	id: number;
	title: string;
	description: string;
	rating_avg: string;
	created_at?: string;
};

type RecipesGridProps = {
	page?: number;
	perPage?: number;
	onLoad?: (totalCount: number) => void;
};

export const RecipesGrid = ({
	page = 1,
	perPage = 12,
	onLoad,
}: RecipesGridProps) => {
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
			.then((body) => {
				const allRecipes: RecipeCardResponse[] = body.data ?? [];
				onLoad?.(allRecipes.length);
				setRecipeList(allRecipes);
			})
			.catch(console.error);
	}, [onLoad]);

	const start = (page - 1) * perPage;
	const pageRecipes = recipeList.slice(start, start + perPage);

	return (
		<ul className="recipe-card-list">
			{pageRecipes.map(({ id, title, description, rating_avg }) => (
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
