import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useParams } from "react-router";
import { z } from "zod";
import recipeImg from "../assets/images/vegetable-side-dishes.jpg";
import "../assets/styles/recipe.css";
import { Reports, StarSolid, Trash } from "iconoir-react";
import { IconButton } from "~/components/buttons/IconButton";
import { RatingModal } from "~/components/rating/ratingModal";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import type { LayoutOutletContext } from "~/layouts/layout";
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

type RecipeReview = {
	id: number;
	recipe_id: number;
	author_id: number | null;
	username: string | null;
	avatar: string | null;
	body: string;
	created_at: string;
	updated_at: string;
};

const RecipeIngredientSchema = z.object({
	ingredient_id: z.number(),
	amount: z.number(),
	unit: z.string(),
	name: z.string(),
});

const RecipeSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string().nullable(),
	rating_avg: z.number().nullable(),
	ingredients: z.array(RecipeIngredientSchema).optional().default([]),
	instructions: z.array(z.string()).optional().default([]),
});

const RecipeResponseSchema = z.object({
	data: RecipeSchema,
});

const RecipeReviewSchema = z.object({
	id: z.number(),
	recipe_id: z.number(),
	author_id: z.number().nullable(),
	username: z.string().nullable(),
	avatar: z.string().nullable(),
	body: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
});

const RecipeReviewsResponseSchema = z.object({
	data: z.array(RecipeReviewSchema),
});

const ProfileResponseSchema = z.object({
	data: z.object({
		id: z.number(),
	}),
});

type FetchRecipeResult = {
	errorStatus: number | "unknown" | null;
	recipe: Recipe | null;
};

type FetchRecipeReviewsResult = {
	errorStatus: number | "unknown" | null;
	reviews: RecipeReview[];
};

const fetchRecipeById = async (id: string): Promise<FetchRecipeResult> => {
	try {
		const response = await fetch(`${API_BASE_URL}/recipes/${id}`);
		if (!response.ok) {
			return { errorStatus: response.status, recipe: null };
		}

		const body = await response.json();
		const parsed = RecipeResponseSchema.safeParse(body);
		if (!parsed.success) {
			return { errorStatus: null, recipe: null };
		}

		return {
			errorStatus: null,
			recipe: parsed.data.data,
		};
	} catch (error: unknown) {
		console.error(error);
		return { errorStatus: "unknown" as const, recipe: null };
	}
};

const fetchRecipeReviews = async (
	id: string,
): Promise<FetchRecipeReviewsResult> => {
	try {
		const response = await fetch(`${API_BASE_URL}/recipes/${id}/reviews`, {
			credentials: "include",
		});
		if (!response.ok) {
			return { errorStatus: response.status, reviews: [] };
		}

		const body = await response.json();
		const parsed = RecipeReviewsResponseSchema.safeParse(body);
		if (!parsed.success) {
			return { errorStatus: null, reviews: [] };
		}

		return { errorStatus: null, reviews: parsed.data.data };
	} catch (error: unknown) {
		console.error(error);
		return { errorStatus: "unknown" as const, reviews: [] };
	}
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
	const [reviews, setReviews] = useState<RecipeReview[]>([]);
	const [areReviewsLoading, setAreReviewsLoading] = useState(true);
	const [reviewsErrorStatus, setReviewsErrorStatus] = useState<
		number | "unknown" | null
	>(null);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
	const [reviewActionError, setReviewActionError] = useState("");

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

	const refreshRecipeData = async () => {
		if (!id) {
			return;
		}

		const [recipeResult, reviewsResult] = await Promise.all([
			fetchRecipeById(id),
			fetchRecipeReviews(id),
		]);

		setErrorStatus(recipeResult.errorStatus);
		setRecipe(recipeResult.recipe);
		setReviewsErrorStatus(reviewsResult.errorStatus);
		setReviews(reviewsResult.reviews);
		setReviewActionError("");
	};

	const deleteFeedback = async (reviewId: number) => {
		if (!id || !window.confirm(t("recipePage.confirmDeleteFeedback"))) {
			return;
		}

		setReviewActionError("");
		setDeletingReviewId(reviewId);

		try {
			const response = await fetch(
				`${API_BASE_URL}/recipes/${id}/reviews/${reviewId}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				setReviewActionError(
					t("recipePage.deleteReviewError", { status: response.status }),
				);
				return;
			}

			const ratingResponse = await fetch(
				`${API_BASE_URL}/recipes/${id}/rating`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!ratingResponse.ok && ratingResponse.status !== 404) {
				setReviewActionError(
					t("recipePage.deleteRatingError", { status: ratingResponse.status }),
				);
				await refreshRecipeData();
				return;
			}

			await refreshRecipeData();
		} catch (error) {
			console.error(error);
			setReviewActionError(
				t("recipePage.deleteReviewError", { status: "unknown" }),
			);
		} finally {
			setDeletingReviewId(null);
		}
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

		void fetchRecipeById(id)
			.then(({ errorStatus, recipe }) => {
				setErrorStatus(errorStatus);
				setRecipe(recipe);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [id]);

	useEffect(() => {
		if (!isAuthenticated) {
			setCurrentUserId(null);
			return;
		}

		let ignoreResult = false;

		const fetchCurrentUserId = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/profile`, {
					credentials: "include",
				});

				if (!response.ok) {
					if (!ignoreResult) {
						setCurrentUserId(null);
					}
					return;
				}

				const body: unknown = await response.json();
				const parsed = ProfileResponseSchema.safeParse(body);

				if (!ignoreResult) {
					setCurrentUserId(parsed.success ? parsed.data.data.id : null);
				}
			} catch (error) {
				console.error(error);
				if (!ignoreResult) {
					setCurrentUserId(null);
				}
			}
		};

		void fetchCurrentUserId();

		return () => {
			ignoreResult = true;
		};
	}, [isAuthenticated]);

	useEffect(() => {
		if (!id) {
			setReviews([]);
			setReviewsErrorStatus("unknown");
			setAreReviewsLoading(false);
			return;
		}

		setAreReviewsLoading(true);
		setReviewsErrorStatus(null);
		setReviewActionError("");
		setReviews([]);

		void fetchRecipeReviews(id)
			.then(({ errorStatus, reviews }) => {
				setReviewsErrorStatus(errorStatus);
				setReviews(reviews);
			})
			.finally(() => {
				setAreReviewsLoading(false);
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

	const instructionOccurrences = new Map<string, number>();
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
				<IconButton className="recipe-action" onClick={onOpenRatingModal}>
					{t("recipePage.rate")} <Reports />
				</IconButton>
				<FavoriteButton />
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

				<section
					className="recipe-page-details-section"
					aria-labelledby="recipe-reviews-heading"
				>
					<h2 id="recipe-reviews-heading">{t("recipePage.reviews")}</h2>

					{areReviewsLoading ? (
						<p className="text-body2">{t("recipePage.reviewsLoading")}</p>
					) : reviewsErrorStatus !== null ? (
						<p className="text-body2">
							{t("recipePage.reviewsError", { status: reviewsErrorStatus })}
						</p>
					) : reviews.length > 0 ? (
						<>
							{reviewActionError ? (
								<p className="recipe-page-review-error text-body2">
									{reviewActionError}
								</p>
							) : null}
							<ul className="recipe-page-detail-list recipe-page-reviews-list">
								{reviews.map((review) => {
									const canDeleteReview =
										currentUserId !== null && review.author_id === currentUserId;

									return (
										<li key={review.id} className="recipe-page-review-card">
											<div className="recipe-page-review-meta">
												<span className="recipe-page-review-author text-label">
													{review.username ?? t("recipePage.reviewAnonymous")}
												</span>
												<time
													className="recipe-page-review-date text-body3"
													dateTime={review.created_at}
												>
													{new Date(review.created_at).toLocaleDateString()}
												</time>
											</div>
											<div className="recipe-page-review-body">
												<p className="text-body3">{review.body}</p>
												{canDeleteReview ? (
													<IconButton
														className="recipe-page-review-delete"
														aria-label={t("ariaLabels.deleteReview")}
														disabled={deletingReviewId === review.id}
														onClick={() => void deleteFeedback(review.id)}
													>
														<Trash aria-hidden="true" />
													</IconButton>
												) : null}
											</div>
										</li>
									);
								})}
							</ul>
						</>
					) : (
						<p className="text-body2">{t("recipePage.noReviewsAvailable")}</p>
					)}
				</section>
			</section>
			<RatingModal
				isOpen={isRatingModalOpen}
				onClose={onCloseRatingModal}
				onSuccess={refreshRecipeData}
				recipeId={String(recipe.id)}
			/>
		</section>
	);
};

export default RecipePage;
