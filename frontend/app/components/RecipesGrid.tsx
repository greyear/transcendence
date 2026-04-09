import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

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
	const { t } = useTranslation();
	const [recipeList, setRecipeList] = useState<RecipeCardResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);

	useEffect(() => {
		fetch(`${API_BASE_URL}/recipes`)
			.then((res) => {
				if (!res.ok) {
					const message = `Failed to fetch recipes: ${res.status}`;
					console.error(message);
					setErrorStatus(res.status);
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
			.catch((error: unknown) => {
				console.error(error);
				setErrorStatus("unknown");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [onLoad, sort]);

	const sortedList = useMemo(
		() => sortRecipes(recipeList, sortValue),
		[recipeList, sortValue],
	);

	const start = (page - 1) * perPage;
	const pageRecipes = sortedList.slice(start, start + perPage);

	if (isLoading) {
		return <p className="recipes-grid-status">{t("recipesGrid.loading")}</p>;
	}

	if (errorStatus !== null) {
		return (
			<p className="recipes-grid-status">
				{t("recipesGrid.error", { status: errorStatus })}
			</p>
		);
	}

	if (recipeList.length === 0) {
		return <p className="recipes-grid-status">{t("recipesGrid.empty")}</p>;
	}

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
