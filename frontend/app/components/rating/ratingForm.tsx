import "~/assets/styles/rating.css";
import { StarSolid, Xmark } from "iconoir-react";
import { type FormEvent, type RefObject, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { IconButton } from "~/components/buttons/IconButton";
import { MainButton } from "~/components/buttons/MainButton";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

type RatingFormProps = {
	dialogRef?: RefObject<HTMLElement | null>;
	onClose?: () => void;
	onSuccess?: () => void | Promise<void>;
	recipeId: string;
};

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

const ApiResponseSchema = z.object({
	error: z.string().optional(),
	message: z.string().optional(),
});

const ProfileResponseSchema = z.object({
	data: z.object({
		id: z.number(),
	}),
});

const RecipeReviewSchema = z.object({
	id: z.number(),
	author_id: z.number().nullable(),
});

const RecipeReviewsResponseSchema = z.object({
	data: z.array(RecipeReviewSchema),
});

export const RatingForm = ({
	dialogRef,
	onClose,
	onSuccess,
	recipeId,
}: RatingFormProps) => {
	const { t } = useTranslation();
	const [rating, setRating] = useState(0);
	const [review, setReview] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const parseApiResponse = async (response: Response) => {
		const body: unknown = await response.json();
		const parsed = ApiResponseSchema.safeParse(body);

		if (!parsed.success) {
			return {};
		}

		return parsed.data;
	};

	const getCurrentUserId = async () => {
		const response = await fetch(`${API_BASE_URL}/profile`, {
			credentials: "include",
		});
		if (!response.ok) {
			return null;
		}

		const body: unknown = await response.json();
		const parsed = ProfileResponseSchema.safeParse(body);

		if (!parsed.success) {
			return null;
		}

		return parsed.data.data.id;
	};

	const getExistingReviewIds = async (userId: number) => {
		const response = await fetch(
			`${API_BASE_URL}/recipes/${recipeId}/reviews`,
			{
				credentials: "include",
			},
		);
		if (!response.ok) {
			return [];
		}

		const body: unknown = await response.json();
		const parsed = RecipeReviewsResponseSchema.safeParse(body);

		if (!parsed.success) {
			return [];
		}

		return parsed.data.data
			.filter((reviewItem) => reviewItem.author_id === userId)
			.map((reviewItem) => reviewItem.id);
	};

	const syncReview = async (trimmedReview: string) => {
		const currentUserId = await getCurrentUserId();
		if (currentUserId === null) {
			setError(t("ratingModal.genericError"));
			return false;
		}

		const existingReviewIds = await getExistingReviewIds(currentUserId);

		if (!trimmedReview) {
			if (existingReviewIds.length === 0) {
				return true;
			}

			for (const existingReviewId of existingReviewIds) {
				const deleteResponse = await fetch(
					`${API_BASE_URL}/recipes/${recipeId}/reviews/${existingReviewId}`,
					{
						method: "DELETE",
						credentials: "include",
					},
				);
				const deleteData = await parseApiResponse(deleteResponse);

				if (!deleteResponse.ok && deleteResponse.status !== 404) {
					setError(deleteData.error ?? t("ratingModal.genericError"));
					return false;
				}
			}

			return true;
		}

		const existingReviewId = existingReviewIds[0] ?? null;
		const reviewResponse = await fetch(
			existingReviewId === null
				? `${API_BASE_URL}/recipes/${recipeId}/reviews`
				: `${API_BASE_URL}/recipes/${recipeId}/reviews/${existingReviewId}`,
			{
				method: existingReviewId === null ? "POST" : "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ body: trimmedReview }),
			},
		);
		const reviewData = await parseApiResponse(reviewResponse);

		if (!reviewResponse.ok) {
			setError(reviewData.error ?? t("ratingModal.genericError"));
			return false;
		}

		return true;
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (rating === 0) {
			return;
		}

		setError("");
		setIsSubmitting(true);

		try {
			const payload = JSON.stringify({ rating });
			let ratingResponse = await fetch(
				`${API_BASE_URL}/recipes/${recipeId}/rating`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: payload,
				},
			);
			let ratingData = await parseApiResponse(ratingResponse);

			if (ratingResponse.status === 409) {
				ratingResponse = await fetch(
					`${API_BASE_URL}/recipes/${recipeId}/rating`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include",
						body: payload,
					},
				);
				ratingData = await parseApiResponse(ratingResponse);
			}

			if (!ratingResponse.ok) {
				setError(ratingData.error ?? t("ratingModal.genericError"));
				return;
			}

			const reviewSynced = await syncReview(review.trim());
			if (!reviewSynced) {
				return;
			}

			setRating(0);
			setReview("");
			await onSuccess?.();
			onClose?.();
		} catch (submitError) {
			console.error(submitError);
			setError(
				submitError instanceof TypeError
					? t("ratingModal.networkError")
					: t("ratingModal.genericError"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section
			className="rating-card"
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="rating-modal-title"
			tabIndex={-1}
		>
			<div className="rating-card-header">
				<h2 className="rating-modal-title" id="rating-modal-title">
					{t("ratingModal.title")}
				</h2>

				{onClose ? (
					<div className="rating-modal-close-row">
						<IconButton
							data-initial-focus
							onClick={onClose}
							aria-label={t("ariaLabels.closeRatingDialog")}
							variant="transparent"
						>
							<Xmark />
						</IconButton>
					</div>
				) : null}
			</div>
			<div className="rating-card-body">
				<form className="rating-form" onSubmit={handleSubmit}>
					<div className="rating-field">
						<span className="rating-field-label text-label" id="rating-label">
							{t("ratingModal.rateRecipe")}{" "}
							<span className="required-asterisk" aria-hidden="true">
								*
							</span>
						</span>
						<div
							className="rating-stars"
							role="radiogroup"
							aria-labelledby="rating-label"
							aria-required="true"
						>
							{RATING_VALUES.map((value) => (
								<label key={value} className="rating-star-option">
									<input
										className="rating-star-input"
										name="rating"
										type="radio"
										value={value}
										checked={rating === value}
										aria-label={t("ratingModal.ratingOption", { value })}
										onChange={() => setRating(value)}
									/>
									<span
										className={`rating-star-button ${value <= rating ? "active" : ""}`}
									>
										<StarSolid />
									</span>
								</label>
							))}
						</div>
					</div>

					<div className="rating-field">
						<label
							className="rating-field-label text-label"
							htmlFor="rating-review"
						>
							{t("ratingModal.describeRecipe")}
						</label>
						<textarea
							id="rating-review"
							name="review"
							className="rating-textarea"
							rows={4}
							maxLength={1000}
							value={review}
							onChange={(event) => setReview(event.target.value)}
						/>
						<p className="rating-help-text text-caption">
							{t("ratingModal.emptyReviewHint")}
						</p>
					</div>

					<div className="rating-status" aria-live="polite">
						{error ? <p className="rating-error">{error}</p> : null}
					</div>

					<MainButton
						type="submit"
						className="rating-submit"
						disabled={rating === 0 || isSubmitting}
					>
						{isSubmitting
							? t("ratingModal.submitting")
							: t("ratingModal.submit")}
					</MainButton>
				</form>
			</div>
		</section>
	);
};
