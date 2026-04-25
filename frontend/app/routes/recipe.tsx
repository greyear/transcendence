import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	type MetaFunction,
	useLocation,
	useOutletContext,
	useParams,
} from "react-router";
import { z } from "zod";
import recipeImg from "../assets/images/vegetable-side-dishes.jpg";
import "../assets/styles/recipe.css";
import { Reports, StarSolid, Trash } from "iconoir-react";
import { IconButton } from "~/components/buttons/IconButton";
import { ConfirmationModal } from "~/components/ConfirmationModal";
import { RatingModal } from "~/components/rating/ratingModal";
import { ReviewModal } from "~/components/review/reviewModal";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import { useDocumentTitle } from "~/composables/useDocumentTitle";
import type { LayoutOutletContext } from "~/layouts/layout";
import { FavoriteRecipesResponseSchema } from "~/schemas/favorites";
import { FavoriteButton } from "../components/buttons/FavoriteButton";

export const meta: MetaFunction = () => [{ title: "Recipe — Transcendence" }];

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
	rating_count: number;
	viewer_rating: number | null;
	picture_url: string | null;
	ingredients: RecipeIngredient[];
	instructions: string[];
};

type RecipeReview = {
	id: number;
	author_id: number | null;
	username: string | null;
	body: string;
	created_at: string;
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
	rating_avg: z.coerce.number().nullable(),
	rating_count: z.coerce.number().optional().default(0),
	viewer_rating: z.coerce.number().nullable().optional().default(null),
	picture_url: z.string().nullable(),
	ingredients: z.array(RecipeIngredientSchema).optional().default([]),
	instructions: z.array(z.string()).optional().default([]),
});

const RecipeResponseSchema = z.object({
	data: RecipeSchema,
});

const RecipeReviewSchema = z.object({
	id: z.number(),
	author_id: z.number().nullable(),
	username: z.string().nullable(),
	body: z.string(),
	created_at: z.string(),
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

const fetchRecipeById = async (
	id: string,
	isAuthenticated: boolean,
	language: string,
): Promise<FetchRecipeResult> => {
	try {
		const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
			credentials: isAuthenticated ? "include" : "omit",
			headers: { "X-Language": language },
		});
		if (!response.ok) {
			return { errorStatus: response.status, recipe: null };
		}

		const body: unknown = await response.json();
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

		const body: unknown = await response.json();
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

const formatReviewDate = (value: string) => {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const RecipeLocationStateSchema = z.object({
	pictureUploadFailed: z.literal(true),
});

const RecipePage = () => {
	const { id } = useParams();
	const { t, i18n } = useTranslation();
	const language = i18n.resolvedLanguage ?? "en";
	const location = useLocation();
	const { isAuthenticated, openAuthModal } =
		useOutletContext<LayoutOutletContext>();

	const [showPictureUploadWarning, setShowPictureUploadWarning] = useState(
		() => RecipeLocationStateSchema.safeParse(location.state).success,
	);

	const [recipe, setRecipe] = useState<Recipe | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);
	const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
	const [reviews, setReviews] = useState<RecipeReview[]>([]);
	const [areReviewsLoading, setAreReviewsLoading] = useState(true);
	const [reviewsErrorStatus, setReviewsErrorStatus] = useState<
		number | "unknown" | null
	>(null);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [reviewIdPendingDelete, setReviewIdPendingDelete] = useState<
		number | null
	>(null);
	const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
	const [reviewActionError, setReviewActionError] = useState("");
	const [isFavorited, setIsFavorited] = useState(false);
	const [isFavoritePending, setIsFavoritePending] = useState(false);

	useDocumentTitle(
		recipe
			? t("pageTitles.recipe", { title: recipe.title })
			: t("pageTitles.recipeLoading"),
	);

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

	const handleFavoriteClick = () => {
		if (!isAuthenticated) {
			openAuthModal(() => {
				void toggleFavorite();
			});
			return;
		}

		void toggleFavorite();
	};

	const onCloseRatingModal = () => {
		setIsRatingModalOpen(false);
	};

	const onCloseReviewModal = () => {
		setIsReviewModalOpen(false);
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

	const onOpenReviewModal = () => {
		if (!isAuthenticated) {
			openAuthModal(() => {
				setIsReviewModalOpen(true);
			});
			return;
		}

		setIsReviewModalOpen(true);
	};

	const onCloseDeleteReviewModal = () => {
		if (deletingReviewId !== null) {
			return;
		}

		setReviewIdPendingDelete(null);
	};

	const refreshRecipeData = async () => {
		if (!id) {
			return;
		}

		const [recipeResult, reviewsResult] = await Promise.all([
			fetchRecipeById(id, isAuthenticated, language),
			fetchRecipeReviews(id),
		]);

		setErrorStatus(recipeResult.errorStatus);
		setRecipe(recipeResult.recipe);
		setReviewsErrorStatus(reviewsResult.errorStatus);
		setReviews(reviewsResult.reviews);
		setReviewActionError("");
	};

	const deleteReview = async (reviewId: number) => {
		if (!id) {
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

			await refreshRecipeData();
		} catch (error) {
			console.error(error);
			setReviewActionError(
				t("recipePage.deleteReviewError", { status: "unknown" }),
			);
		} finally {
			setDeletingReviewId(null);
			setReviewIdPendingDelete(null);
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

		// TODO: expose ownership in the recipe response so we can show an edit
		// button only for the recipe author.
		void fetchRecipeById(id, isAuthenticated, language)
			.then(({ errorStatus, recipe }) => {
				setErrorStatus(errorStatus);
				setRecipe(recipe);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [id, isAuthenticated, language]);

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
			setReviewIdPendingDelete(null);
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

	useEffect(() => {
		if (!isAuthenticated || !id) {
			setIsFavorited(false);
			setIsFavoritePending(false);
			return;
		}

		let ignoreResult = false;

		fetch(`${API_BASE_URL}/users/me/favorites`, {
			credentials: "include",
		})
			.then((res) => {
				if (!res.ok) {
					return null;
				}
				return res.json();
			})
			.then((body: unknown) => {
				if (ignoreResult) {
					return;
				}

				if (body === null) {
					setIsFavorited(false);
					return;
				}

				const parsed = FavoriteRecipesResponseSchema.safeParse(body);
				if (!parsed.success) {
					setIsFavorited(false);
					return;
				}

				const currentRecipeId = Number(id);
				setIsFavorited(
					parsed.data.data.some((favorite) => favorite.id === currentRecipeId),
				);
			})
			.catch((error) => {
				console.error(error);
				if (!ignoreResult) {
					setIsFavorited(false);
				}
			});

		return () => {
			ignoreResult = true;
		};
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
		<div className="recipe-page">
			{showPictureUploadWarning ? (
				<output
					className="recipe-page-warning"
					aria-live="polite"
					aria-atomic="true"
				>
					<span className="recipe-page-warning-text text-body3">
						{t("recipePage.pictureUploadFailedWarning")}
					</span>
					<button
						type="button"
						className="recipe-page-warning-dismiss"
						onClick={() => setShowPictureUploadWarning(false)}
						aria-label={t("ariaLabels.dismissWarning")}
					>
						&times;
					</button>
				</output>
			) : null}
			<section className="recipe-page-hero">
				<div className="recipe-page-hero-text">
					<h1 id="recipe-title">{recipe.title}</h1>
					{recipe.description ? (
						<p className="text-body2">{recipe.description}</p>
					) : null}
				</div>

				<div className="recipe-page-hero-media">
					<img className="recipe-page-hero-image" src={recipeImageSrc} alt="" />
				</div>
			</section>

			<div className="recipe-page-actions">
				{recipe.rating_avg !== null ? (
					<div
						className="recipe-rating-display text-label"
						role="img"
						aria-label={t("recipePage.ratingDisplayLabel", {
							rating: recipe.rating_avg.toFixed(1),
							count: recipe.rating_count,
						})}
					>
						<span aria-hidden="true">{recipe.rating_avg.toFixed(1)}</span>
						<StarSolid aria-hidden="true" />
						<span className="recipe-rating-count" aria-hidden="true">
							({recipe.rating_count})
						</span>
					</div>
				) : null}
				<IconButton className="recipe-action" onClick={onOpenRatingModal}>
					{t("recipePage.rate")} <StarSolid aria-hidden="true" />
				</IconButton>
				<IconButton className="recipe-action" onClick={onOpenReviewModal}>
					{t("recipePage.review")} <Reports aria-hidden="true" />
				</IconButton>
				<FavoriteButton
					isFavorited={isFavorited}
					disabled={isFavoritePending}
					onClick={handleFavoriteClick}
				/>
				{/* TODO: add an edit button here, visible only to the recipe owner. */}
			</div>

			<div className="recipe-page-content">
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
										currentUserId !== null &&
										review.author_id === currentUserId;

									return (
										<li key={review.id} className="recipe-page-review-card">
											<div className="recipe-page-review-meta">
												<span className="recipe-page-review-author text-caption">
													{review.username ?? t("recipePage.reviewAnonymous")}
												</span>
												<div className="recipe-page-review-meta-details">
													<time
														className="recipe-page-review-date text-caption"
														dateTime={review.created_at}
													>
														{formatReviewDate(review.created_at)}
													</time>
												</div>
											</div>
											<div className="recipe-page-review-body">
												<p className="text-body3">{review.body}</p>
												<div className="recipe-page-review-action">
													{canDeleteReview ? (
														<IconButton
															className="recipe-page-review-delete"
															aria-label={t("ariaLabels.deleteReview")}
															disabled={deletingReviewId === review.id}
															onClick={() =>
																setReviewIdPendingDelete(review.id)
															}
														>
															<Trash aria-hidden="true" />
														</IconButton>
													) : null}
												</div>
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
			</div>
			<RatingModal
				isOpen={isRatingModalOpen}
				onClose={onCloseRatingModal}
				onSuccess={refreshRecipeData}
				recipeId={String(recipe.id)}
				initialRating={recipe.viewer_rating}
			/>
			<ReviewModal
				isOpen={isReviewModalOpen}
				onClose={onCloseReviewModal}
				onSuccess={refreshRecipeData}
				recipeId={String(recipe.id)}
			/>
			<ConfirmationModal
				isOpen={reviewIdPendingDelete !== null}
				onClose={onCloseDeleteReviewModal}
				onConfirm={() =>
					reviewIdPendingDelete === null
						? undefined
						: deleteReview(reviewIdPendingDelete)
				}
				title={t("recipePage.confirmDeleteReview")}
				confirmLabel={t("ariaLabels.deleteReview")}
				isConfirming={deletingReviewId !== null}
			/>
		</div>
	);
};

export default RecipePage;
