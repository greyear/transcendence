import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";
import { useEffect, useMemo, useState } from "react";

type RecipeCardResponse = {
	id: number;
	title: string;
	description: string;
	rating_avg: string;
	// created_at: string;
};

type RecipesGridProps = {
	sortValue: string;
	page?: number;
	perPage?: number;
	onLoad?: (totalCount: number) => void;
	sort?: "top";
};

const sortRecipes = (
	recipes: RecipeCardResponse[],
	sortValue: string,
): RecipeCardResponse[] => {
	const sorted = [...recipes];
	switch (sortValue) {
		case "name-asc":
			return sorted.sort((a, b) => a.title.localeCompare(b.title));
		case "name-desc":
			return sorted.sort((a, b) => b.title.localeCompare(a.title));
		// case "date-asc":
		// 	return sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
		// case "date-desc":
		// 	return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
		default:
			return sorted;
	}
};

export const RecipesGrid = ({
	page = 1,
	perPage = 12,
	onLoad,
	sort,
	sortValue,
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

	const sortedList = useMemo(
		() => sortRecipes(recipeList, sortValue),
		[recipeList, sortValue],
	);

	const start = (page - 1) * perPage;
	const pageRecipes = sortedList.slice(start, start + perPage);

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
