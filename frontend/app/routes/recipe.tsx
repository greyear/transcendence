import { FireFlame, Reports, StarSolid, Translate, Trash } from "iconoir-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	type MetaFunction,
	useLocation,
	useNavigate,
	useOutletContext,
	useParams,
} from "react-router";
import { z } from "zod";
import recipeImg from "../assets/images/vegetable-side-dishes.jpg";
import "../assets/styles/recipe.scss";
import { IconButton } from "~/components/buttons/IconButton";
import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { ConfirmationModal } from "~/components/ConfirmationModal";
import { NotFoundView } from "~/components/NotFoundView";
import { RatingModal } from "~/components/rating/ratingModal";
import { ReviewModal } from "~/components/review/reviewModal";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import { useDocumentTitle } from "~/composables/useDocumentTitle";
import type { LayoutOutletContext } from "~/layouts/layout";
import { FavoriteRecipesResponseSchema } from "~/schemas/favorites";
import { FavoriteButton } from "../components/buttons/FavoriteButton";

export const meta: MetaFunction = () => [
	{ title: "Recipe — Transcendence" },
	{
		name: "description",
		content:
			"View the full recipe with ingredients, step-by-step instructions, and community reviews.",
	},
];

type RecipeIngredient = {
	ingredient_id: number;
	amount: number;
	unit: string;
	unit_name?: string;
	name: string;
};

type RecipeCategory = {
	id: number;
	code: string;
	name?: string;
};

type Recipe = {
	id: number;
	author_id: number | null;
	title: string;
	description: string | null;
	servings: number;
	spiciness: number;
	rating_avg: number | null;
	rating_count: number;
	viewer_rating: number | null;
	picture_url: string | null;
	ingredients: RecipeIngredient[];
	categories: RecipeCategory[];
	cook_time: number | null;
	created_at: string | null;
	updated_at: string | null;
	instructions: string[];
	status: string | null;
};

const RecipeIngredientSchema = z.object({
	ingredient_id: z.number(),
	amount: z.number(),
	unit: z.string(),
	unit_name: z.string().optional(),
	name: z.string(),
});

const RecipeCategorySchema = z.object({
	id: z.number(),
	code: z.string(),
	name: z.string().optional(),
});

const RecipeSchema = z.object({
	id: z.number(),
	author_id: z.coerce.number().int().positive().nullable(),
	title: z.string(),
	description: z.string().nullable(),
	servings: z.coerce.number().int().positive().optional().default(1),
	spiciness: z.coerce.number().int().min(0).max(3).optional().default(0),
	rating_avg: z.coerce.number().nullable(),
	rating_count: z.coerce.number().optional().default(0),
	viewer_rating: z.coerce.number().nullable().optional().default(null),
	picture_url: z.string().nullable(),
	ingredients: z.array(RecipeIngredientSchema).optional().default([]),
	categories: z.array(RecipeCategorySchema).optional().default([]),
	cook_time: z.coerce
		.number()
		.int()
		.positive()
		.nullable()
		.optional()
		.default(null),
	created_at: z.string().nullable().optional().default(null),
	updated_at: z.string().nullable().optional().default(null),
	instructions: z.array(z.string()).optional().default([]),
	status: z.string().nullable().optional().default(null),
});

const RecipeResponseSchema = z.object({
	data: RecipeSchema,
});

const ReviewLanguageSchema = z.enum(["en", "fi", "ru"]);

const RecipeReviewSchema = z.object({
	id: z.number(),
	author_id: z.number().nullable(),
	username: z.string().nullable(),
	body: z.string(),
	source_language: ReviewLanguageSchema,
	created_at: z.string(),
	updated_at: z.string(),
});

const RecipeReviewsResponseSchema = z.object({
	data: z.array(RecipeReviewSchema),
});

type RecipeReview = z.infer<typeof RecipeReviewSchema>;

const ReviewTranslationResponseSchema = z.object({
	data: z.object({
		review_id: z.number(),
		translated_body: z.string(),
	}),
});

const ProfileResponseSchema = z.object({
	data: z.object({
		id: z.number(),
	}),
});

type ReviewLanguage = z.infer<typeof ReviewLanguageSchema>;

const normalizeReviewLanguage = (value: string | undefined): ReviewLanguage => {
	const normalized = (value ?? "en").slice(0, 2).toLowerCase();
	const parsed = ReviewLanguageSchema.safeParse(normalized);
	return parsed.success ? parsed.data : "en";
};

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
	} catch {
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
			if (response.status === 404) {
				return { errorStatus: null, reviews: [] };
			}
			return { errorStatus: response.status, reviews: [] };
		}

		const body: unknown = await response.json();
		const parsed = RecipeReviewsResponseSchema.safeParse(body);
		if (!parsed.success) {
			return { errorStatus: null, reviews: [] };
		}

		return { errorStatus: null, reviews: parsed.data.data };
	} catch {
		return { errorStatus: "unknown" as const, reviews: [] };
	}
};

const formatReviewDate = (value: string, language: string) => {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat(language, {
		dateStyle: "medium",
	}).format(date);
};

const formatRecipeDateTime = (value: string | null, language: string) => {
	if (!value) {
		return null;
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat(language, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
};

const formatCategoryCode = (value: string) =>
	value
		.split(/[_-]/)
		.filter(Boolean)
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(" ");
const UNIT_ABBREVIATIONS_BY_LOCALE: Readonly<
	Record<string, Readonly<Record<string, string>>>
> = {
	fi: {
		kg: "kg",
		g: "g",
		mg: "mg",
		ml: "ml",
		l: "l",
		tsp: "tl",
		tbsp: "rkl",
		pcs: "kpl",
		slice: "viip.",
		clove: "kynsi",
	},
	ru: {
		kg: "кг",
		g: "г",
		mg: "мг",
		ml: "мл",
		l: "л",
		tsp: "ч. л.",
		tbsp: "ст. л.",
		pcs: "шт.",
		slice: "ломт.",
		clove: "зубч.",
	},
};

const formatIngredientUnit = (unitCode: string, language: string): string => {
	const locale = language.slice(0, 2).toLowerCase();
	const normalizedCode = unitCode.trim().toLowerCase();
	const localized = UNIT_ABBREVIATIONS_BY_LOCALE[locale]?.[normalizedCode];

	return localized ?? unitCode;
};

const RecipeLocationStateSchema = z.object({
	pictureUploadFailed: z.literal(true),
});

const RecipePage = () => {
	const { id } = useParams();
	const { t, i18n } = useTranslation();
	const language = normalizeReviewLanguage(i18n.resolvedLanguage);
	const location = useLocation();
	const navigate = useNavigate();
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
	const [translatingReviewId, setTranslatingReviewId] = useState<number | null>(
		null,
	);
	const [translatedReviewBodies, setTranslatedReviewBodies] = useState<
		Record<
			number,
			{ body: string; language: ReviewLanguage; updatedAt: string }
		>
	>({});
	const [visibleTranslatedReviewIds, setVisibleTranslatedReviewIds] = useState<
		Record<number, boolean>
	>({});
	const [reviewActionError, setReviewActionError] = useState("");
	const [isFavorited, setIsFavorited] = useState(false);
	const [isFavoritePending, setIsFavoritePending] = useState(false);
	const [deleteRecipeDeletionError, setDeleteRecipeDeletionError] =
		useState("");
	const [deletingRecipe, setDeletingRecipe] = useState(false);
	const [isDeleteRecipeModalOpen, setIsDeleteRecipeModalOpen] = useState(false);

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
		} catch {
			setIsFavorited(wasFavoritedBeforeClick);
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
		setTranslatedReviewBodies({});
		setVisibleTranslatedReviewIds({});
	};

	const onCloseDeleteRecipeModal = () => {
		if (deletingRecipe) {
			return;
		}

		setIsDeleteRecipeModalOpen(false);
	};

	const deleteRecipe = async () => {
		if (!id) {
			return;
		}

		let shouldNavigateToRecipes = false;

		setDeleteRecipeDeletionError("");
		setDeletingRecipe(true);

		try {
			const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (!response.ok) {
				setDeleteRecipeDeletionError(
					t("recipePage.deleteRecipeError", { status: response.status }),
				);
				return;
			}

			shouldNavigateToRecipes = true;
		} catch {
			setDeleteRecipeDeletionError(
				t("recipePage.deleteRecipeError", { status: "unknown" }),
			);
		} finally {
			setDeletingRecipe(false);
			setIsDeleteRecipeModalOpen(false);
		}

		if (shouldNavigateToRecipes) {
			navigate("/recipes");
		}
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
		} catch {
			setReviewActionError(
				t("recipePage.deleteReviewError", { status: "unknown" }),
			);
		} finally {
			setDeletingReviewId(null);
			setReviewIdPendingDelete(null);
		}
	};

	const translateReview = async (reviewId: number) => {
		if (!id || translatingReviewId !== null) {
			return;
		}

		if (!isAuthenticated) {
			openAuthModal(() => {
				void translateReview(reviewId);
			});
			return;
		}

		const review = reviews.find((item) => item.id === reviewId);
		if (!review) {
			return;
		}

		const currentTranslation = translatedReviewBodies[reviewId];
		if (
			currentTranslation?.language === language &&
			currentTranslation.updatedAt === review.updated_at
		) {
			setVisibleTranslatedReviewIds((current) => ({
				...current,
				[reviewId]: !current[reviewId],
			}));
			return;
		}

		setReviewActionError("");
		setTranslatingReviewId(reviewId);

		try {
			const response = await fetch(
				`${API_BASE_URL}/recipes/${id}/reviews/${reviewId}/translate`,
				{
					headers: {
						"X-Language": language,
					},
					credentials: "include",
				},
			);

			if (!response.ok) {
				setReviewActionError(
					t("recipePage.translateReviewError", { status: response.status }),
				);
				return;
			}

			const body: unknown = await response.json();
			const parsed = ReviewTranslationResponseSchema.safeParse(body);

			if (!parsed.success) {
				setReviewActionError(
					t("recipePage.translateReviewError", { status: "unknown" }),
				);
				return;
			}

			setTranslatedReviewBodies((current) => ({
				...current,
				[parsed.data.data.review_id]: {
					body: parsed.data.data.translated_body,
					language,
					updatedAt: review.updated_at,
				},
			}));
			setVisibleTranslatedReviewIds((current) => ({
				...current,
				[parsed.data.data.review_id]: true,
			}));
		} catch {
			setReviewActionError(
				t("recipePage.translateReviewError", { status: "unknown" }),
			);
		} finally {
			setTranslatingReviewId(null);
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
			} catch {
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
				setTranslatedReviewBodies({});
				setVisibleTranslatedReviewIds({});
			})
			.finally(() => {
				setAreReviewsLoading(false);
			});
	}, [id]);

	useEffect(() => {
		if (!deleteRecipeDeletionError) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setDeleteRecipeDeletionError("");
		}, 5_000);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [deleteRecipeDeletionError]);

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
			.catch(() => {
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

	if (errorStatus === 403) {
		return (
			<div className="recipe-page-forbidden">
				<p className="recipe-page-forbidden-title text-body2">
					{t("recipePage.forbiddenTitle")}
				</p>
				<MainButton to="/recipes" variant="primary">
					{t("recipePage.backToRecipes")}
				</MainButton>
			</div>
		);
	}

	if (errorStatus === 404) {
		return <NotFoundView />;
	}

	if (errorStatus !== null) {
		return (
			<p className="recipe-page-status">
				{t("recipePage.error", { status: errorStatus })}
			</p>
		);
	}

	if (!recipe) {
		return <NotFoundView />;
	}

	const instructionOccurrences = new Map<string, number>();
	const recipeImageSrc = resolveMediaUrl(recipe.picture_url) ?? recipeImg;
	const createdAt = formatRecipeDateTime(recipe.created_at, language);
	const isAuthor = recipe.author_id === currentUserId && currentUserId !== null;
	const isArchived = recipe.status === "archived";

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
			{showPictureUploadWarning && (
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
			)}
			<section className="recipe-page-hero">
				<div className="recipe-page-hero-text">
					<h1 id="recipe-title">{recipe.title}</h1>
					{recipe.description && (
						<p className="text-body2">{recipe.description}</p>
					)}
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
				{recipe.rating_avg !== null && (
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
				)}
				{!isAuthor && (
					<>
						<IconButton className="recipe-action" onClick={onOpenRatingModal}>
							{t("recipePage.rate")} <StarSolid aria-hidden="true" />
						</IconButton>
						<IconButton className="recipe-action" onClick={onOpenReviewModal}>
							{t("recipePage.review")} <Reports aria-hidden="true" />
						</IconButton>
					</>
				)}
				{!isArchived && (
					<FavoriteButton
						isFavorited={isFavorited}
						disabled={isFavoritePending}
						onClick={handleFavoriteClick}
					/>
				)}
				{isAuthor && !isArchived && (
					<IconButton
						className="recipe-action delete-recipe"
						disabled={deletingRecipe}
						onClick={() => setIsDeleteRecipeModalOpen(true)}
					>
						{t("recipePage.delete")} <Trash aria-hidden="true" />
					</IconButton>
				)}
			</div>

			{deleteRecipeDeletionError && (
				<p className="recipe-page-action-error text-body2">
					{deleteRecipeDeletionError}
				</p>
			)}

			<section
				className="recipe-page-meta"
				aria-label={t("recipePage.details")}
			>
				{createdAt && (
					<div className="recipe-page-timestamps text-caption">
						<span>
							{t("recipePage.createdAt")}:{" "}
							<time dateTime={recipe.created_at ?? undefined}>{createdAt}</time>
						</span>
					</div>
				)}

				{recipe.categories.length > 0 && (
					<ul
						className="recipe-page-category-list"
						aria-label={t("recipePage.categories")}
					>
						{recipe.categories.map((category) => (
							<li
								key={category.id}
								className="recipe-page-category-chip text-caption"
							>
								{category.name ?? formatCategoryCode(category.code)}
							</li>
						))}
					</ul>
				)}

				<ul className="recipe-page-facts">
					<li className="recipe-page-detail-item recipe-page-fact">
						<span className="recipe-page-fact-label">
							{t("recipePage.portions")}
						</span>
						<p className="recipe-page-fact-value">{recipe.servings}</p>
					</li>
					<li className="recipe-page-detail-item recipe-page-fact">
						<span className="recipe-page-fact-label">
							{t("recipePage.cookTime")}
						</span>
						<p className="recipe-page-fact-value">
							{recipe.cook_time === null
								? t("recipePage.notAvailable")
								: t("recipePage.minutes", { count: recipe.cook_time })}
						</p>
					</li>
					<li className="recipe-page-detail-item recipe-page-fact">
						<span className="recipe-page-fact-label">
							{t("recipePage.spiciness")}
						</span>
						<span
							className="recipe-page-spice-scale"
							role="img"
							aria-label={t("recipePage.spicinessValue", {
								value: recipe.spiciness,
							})}
						>
							{[1, 2, 3].map((level) => (
								<FireFlame
									key={level}
									aria-hidden="true"
									className={
										level <= recipe.spiciness
											? "recipe-page-spice-icon is-active"
											: "recipe-page-spice-icon"
									}
								/>
							))}
						</span>
					</li>
				</ul>
			</section>

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
										{ingredient.name}
										{", "}
										{ingredient.amount}{" "}
										{formatIngredientUnit(ingredient.unit, language)}
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
							{reviewActionError && (
								<p className="recipe-page-review-error text-body2">
									{reviewActionError}
								</p>
							)}
							<ul className="recipe-page-detail-list recipe-page-reviews-list">
								{reviews.map((review) => {
									const canDeleteReview =
										currentUserId !== null &&
										review.author_id === currentUserId;
									const translatedReview = translatedReviewBodies[review.id];
									const isReviewTranslated =
										translatedReview?.language === language &&
										translatedReview.updatedAt === review.updated_at &&
										visibleTranslatedReviewIds[review.id] === true;
									const isReviewTranslating = translatingReviewId === review.id;
									const canTranslateReview =
										review.source_language !== language;
									const reviewBody = isReviewTranslated
										? (translatedReview?.body ?? review.body)
										: review.body;

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
														{formatReviewDate(review.created_at, language)}
													</time>
												</div>
											</div>
											<div className="recipe-page-review-body">
												<p className="text-body3">{reviewBody}</p>
												<div className="recipe-page-review-action">
													{canDeleteReview && (
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
													)}
												</div>
											</div>
											{canTranslateReview ? (
												<div className="recipe-page-review-translate-row">
													<TextIconButton
														size="body3"
														className="recipe-page-review-translate"
														disabled={isReviewTranslating}
														selected={isReviewTranslated}
														onClick={() => translateReview(review.id)}
													>
														<Translate aria-hidden="true" />
														{isReviewTranslating
															? t("recipePage.translatingReview")
															: isReviewTranslated
																? t("recipePage.showOriginalReview")
																: t("recipePage.translateReview")}
													</TextIconButton>
												</div>
											) : null}
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
			<ConfirmationModal
				isOpen={isDeleteRecipeModalOpen}
				onClose={onCloseDeleteRecipeModal}
				onConfirm={deleteRecipe}
				title={t("recipePage.confirmDeleteRecipe")}
				confirmLabel={t("recipePage.delete")}
				isConfirming={deletingRecipe}
			/>
		</div>
	);
};

export default RecipePage;
