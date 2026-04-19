import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useParams } from "react-router";
import recipeImg from "../assets/images/vegetable-side-dishes.jpg";
import "../assets/styles/recipe.css";
import { ArrowEmailForward, Reports, StarSolid } from "iconoir-react";
import { IconButton } from "~/components/buttons/IconButton";
import { RatingModal } from "~/components/rating/ratingModal";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import type { LayoutOutletContext } from "~/layouts/layout";
import { FavoriteRecipesResponseSchema } from "~/schemas/favorites";
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
	picture_url: string | null;
	ingredients: RecipeIngredient[];
	instructions: string[];
};

const RecipePage = () => {
	const { id } = useParams();
	const { t } = useTranslation();
	const { isAuthenticated, openAuthModal } =
		useOutletContext<LayoutOutletContext>();

	const [recipe, setRecipe] = useState<Recipe | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);
	const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
	const [isFavorited, setIsFavorited] = useState(false);
	const [isFavoritePending, setIsFavoritePending] = useState(false);

	const toggleFavorite = async () => {
		if (!id || isFavoritePending) {
			return;
		}
		const wasFavoritedBeforeClick = isFavorited;
		const shouldBeFavorited = !wasFavoritedBeforeClick;

		setIsFavorited(shouldBeFavorited);
		setIsFavoritePending(true);
		try {
			const response = await fetch(`${API_BASE_URL}/recipes/${id}/favorite`, {
				method: shouldBeFavorited ? "POST" : "DELETE",
				credentials: "include",
			});

			if (!response.ok) {
				if (response.status === 409) {
					setIsFavorited(shouldBeFavorited);
					return;
				}

				setIsFavorited(wasFavoritedBeforeClick);
				return;
			}

			setIsFavorited(shouldBeFavorited);
		} catch (error) {
			setIsFavorited(wasFavoritedBeforeClick);
			console.error(error);
		} finally {
			setIsFavoritePending(false);
		}
	};

	const onCloseRatingModal = () => {
		setIsRatingModalOpen(false);
	};

	const onOpenRatingModal = () => {
		if (!isAuthenticated) {
			openAuthModal(() => {
				setIsRatingModalOpen(true);
			});
			return;
		}

		setIsRatingModalOpen(true);
	};

	const handleFavoriteClick = () => {
		if (!isAuthenticated) {
			openAuthModal(() => {
				void toggleFavorite();
			});
			return;
		}
		void toggleFavorite();
	};

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
					setErrorStatus(res.status);
					return null;
				}
				return res.json();
			})
			.then((body) => {
				if (!body?.data) {
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
				setErrorStatus("unknown");
				console.error(error);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [id]);

	useEffect(() => {
		if (!isAuthenticated || !id) {
			setIsFavorited(false);
			return;
		}

		fetch(`${API_BASE_URL}/users/me/favorites`, {
			credentials: "include",
		})
			.then((res) => {
				if (!res.ok) {
					return null;
				}
				return res.json();
			})
			.then((body) => {
				if (body === null) {
					setIsFavorited(false);
					return;
				}

				const parsed = FavoriteRecipesResponseSchema.safeParse(body);

				if (!parsed.success) {
					setIsFavorited(false);
					return;
				}

				const favorites = parsed.data.data;
				const currentRecipeId = Number(id);

				const recipeIsInFavorites = favorites.some(
					(favorite) => favorite.id === currentRecipeId,
				);
				setIsFavorited(recipeIsInFavorites);
			})
			.catch((error) => {
				console.error(error);
			});
	}, [id, isAuthenticated]);

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

	const instructionOccurrences = new Map<string, number>();
	const recipeImageSrc = resolveMediaUrl(recipe.picture_url) ?? recipeImg;
	const instructionsWithKeys = recipe.instructions.map((instruction) => {
		const occurrenceCount = (instructionOccurrences.get(instruction) ?? 0) + 1;
		instructionOccurrences.set(instruction, occurrenceCount);

		return {
			instruction,
			key: `${instruction}-${occurrenceCount}`,
		};
	});

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
						src={recipeImageSrc}
						alt={recipe.title}
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
				<IconButton className="recipe-action" onClick={onOpenRatingModal}>
					{t("recipePage.rate")} <Reports />
				</IconButton>
				<FavoriteButton
					isFavorited={isFavorited}
					disabled={isFavoritePending}
					onClick={handleFavoriteClick}
				/>
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
							{instructionsWithKeys.map(({ instruction, key }, index) => (
								<li key={key} className="recipe-page-detail-item">
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
			<RatingModal isOpen={isRatingModalOpen} onClose={onCloseRatingModal} />
		</section>
	);
};

export default RecipePage;
