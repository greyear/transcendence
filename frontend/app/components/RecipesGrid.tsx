import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";
import { useEffect, useState } from "react";

type RecipeCardResponse = {
	id: number;
	title: string;
	description: string;
	rating_avg: string;
};

type RecipesGridProps = {
	page?: number;
	perPage?: number;
	onLoad?: (totalCount: number) => void;
	sort?: "top";
};

export const RecipesGrid = ({
	page = 1,
	perPage = 12,
	onLoad,
	sort,
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
				let allRecipes: RecipeCardResponse[] = body.data ?? [];

				if (sort === "top") {
					allRecipes = [...allRecipes].sort(
						(a, b) => Number(b.rating_avg) - Number(a.rating_avg),
					);
				}
				onLoad?.(allRecipes.length);
				setRecipeList(allRecipes);
			})
			.catch(console.error);
	}, [onLoad, sort]);

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
