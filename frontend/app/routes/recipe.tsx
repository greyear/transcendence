import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import recipeImg from "../assets/images/vegetable-side-dishes.jpg";
import "../assets/styles/recipe.css";
import { ArrowEmailForward, Reports, StarSolid } from "iconoir-react";
import { IconButton } from "~/components/buttons/IconButton";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { FavoriteButton } from "../components/buttons/FavoriteButton";

type RecipeIngredient = {
	ingredient_id: number;
	amount: number;
	unit: string;
	name: string;
};

type Recipe = {
	id: number;
	title: string;
	description: string | null;
	rating_avg: number | null;
	ingredients: RecipeIngredient[];
	instructions: string[];
};

const RecipePage = () => {
	const { id } = useParams();
	const { t } = useTranslation();

	const [recipe, setRecipe] = useState<Recipe | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);

	useEffect(() => {
		if (!id) {
			setErrorStatus("unknown");
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setErrorStatus(null);
		setRecipe(null);

		fetch(`${API_BASE_URL}/recipes/${id}`)
			.then((res) => {
				if (!res.ok) {
					throw new Error(String(res.status));
				}
				return res.json();
			})
			.then((body) => {
				if (!body.data) {
					setRecipe(null);
					return;
				}

				setRecipe({
					...body.data,
					ingredients: body.data.ingredients ?? [],
					instructions: body.data.instructions ?? [],
				});
			})
			.catch((error: unknown) => {
				if (error instanceof Error && /^\d+$/.test(error.message)) {
					setErrorStatus(Number(error.message));
				} else {
					setErrorStatus("unknown");
				}
				console.error(error);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [id]);

	if (isLoading) {
		return <p className="recipe-page-status">{t("recipePage.loading")}</p>;
	}

	if (errorStatus !== null) {
		return (
			<p className="recipe-page-status">
				{t("recipePage.error", { status: errorStatus })}
			</p>
		);
	}

	if (!recipe) {
		return (
			<p className="recipe-page-status">{t("recipePage.recipeNotFound")}</p>
		);
	}

	return (
		<section className="recipe-page" aria-labelledby="recipe-title">
			<section className="recipe-page-hero">
				<div className="recipe-page-hero-text">
					<h1 id="recipe-title">{recipe.title}</h1>
					{recipe.description ? (
						<p className="text-body2">{recipe.description}</p>
					) : null}
				</div>

				<div className="recipe-page-hero-media">
					<img
						className="recipe-page-hero-image"
						src={recipeImg}
						alt="Vegetable side dishes"
					/>
				</div>
			</section>

			<div className="recipe-page-actions">
				{recipe.rating_avg !== null ? (
					<div className="recipe-rating-display text-label">
						<span>{recipe.rating_avg.toFixed(1)}</span>
						<StarSolid />
					</div>
				) : null}
				<IconButton className="recipe-action">
					{t("recipePage.rate")} <Reports />
				</IconButton>
				<FavoriteButton />
				<IconButton
					className="recipe-action"
					aria-label={t("ariaLabels.shareRecipe")}
				>
					<span className="recipe-action-label">{t("recipePage.share")}</span>
					<ArrowEmailForward aria-hidden="true" />
				</IconButton>
			</div>

			<section
				className="recipe-page-content"
				aria-label={t("ariaLabels.ingredientsAndInstructions")}
			>
				<section
					className="recipe-page-details-section"
					aria-labelledby="recipe-ingredients-heading"
				>
					<h2 id="recipe-ingredients-heading">{t("recipePage.ingredients")}</h2>
					{recipe.ingredients.length > 0 ? (
						<ul className="recipe-page-detail-list">
							{recipe.ingredients.map((ingredient) => (
								<li
									key={`${ingredient.ingredient_id}-${ingredient.amount}-${ingredient.unit}-${ingredient.name}`}
									className="recipe-page-detail-item"
								>
									<p className="text-body3">
										{ingredient.amount} {ingredient.unit} {ingredient.name}
									</p>
								</li>
							))}
						</ul>
					) : (
						<p className="text-body2">
							{t("recipePage.noIngredientsAvailable")}
						</p>
					)}
				</section>

				<section
					className="recipe-page-details-section"
					aria-labelledby="recipe-instructions-heading"
				>
					<h2 id="recipe-instructions-heading">
						{t("recipePage.instructions")}
					</h2>

					{recipe.instructions.length > 0 ? (
						<ol className="recipe-page-detail-list recipe-page-instructions-list">
							{recipe.instructions.map((instruction, index) => (
								<li key={instruction} className="recipe-page-detail-item">
									<span className="recipe-page-step-label text-label">
										{t("recipePage.step", { number: index + 1 })}
									</span>
									<p className="text-body3">{instruction}</p>
								</li>
							))}
						</ol>
					) : (
						<p className="text-body2">
							{t("recipePage.noInstructionsAvailable")}
						</p>
					)}
				</section>
			</section>
		</section>
	);
};

export default RecipePage;
