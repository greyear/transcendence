import "~/assets/styles/review.css";
import { Xmark } from "iconoir-react";
import { type FormEvent, type RefObject, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { IconButton } from "~/components/buttons/IconButton";
import { MainButton } from "~/components/buttons/MainButton";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

type ReviewFormProps = {
	dialogRef?: RefObject<HTMLElement | null>;
	onClose?: () => void;
	onSuccess?: () => void | Promise<void>;
	recipeId: string;
};

const ApiResponseSchema = z.object({
	error: z.string().optional(),
	message: z.string().optional(),
});

export const ReviewForm = ({
	dialogRef,
	onClose,
	onSuccess,
	recipeId,
}: ReviewFormProps) => {
	const { t, i18n } = useTranslation();
	const language = i18n.resolvedLanguage ?? "en";
	const [review, setReview] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const trimmedReview = useMemo(() => review.trim(), [review]);

	const parseApiResponse = async (response: Response) => {
		const body: unknown = await response.json();
		const parsed = ApiResponseSchema.safeParse(body);

		if (!parsed.success) {
			return {};
		}

		return parsed.data;
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!trimmedReview) {
			return;
		}

		setError("");
		setIsSubmitting(true);

		try {
			const reviewResponse = await fetch(
				`${API_BASE_URL}/recipes/${recipeId}/reviews`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Language": language,
						"X-Source-Language": language,
					},
					credentials: "include",
					body: JSON.stringify({ body: trimmedReview }),
				},
			);
			const reviewData = await parseApiResponse(reviewResponse);

			if (!reviewResponse.ok) {
				setError(reviewData.error ?? t("reviewModal.genericError"));
				return;
			}

			setReview("");
			await onSuccess?.();
			onClose?.();
		} catch (submitError) {
			console.error(submitError);
			setError(
				submitError instanceof TypeError
					? t("reviewModal.networkError")
					: t("reviewModal.genericError"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section
			className="review-card"
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="review-modal-title"
			tabIndex={-1}
		>
			<div className="review-card-header">
				<h2 className="review-modal-title" id="review-modal-title">
					{t("reviewModal.title")}
				</h2>

				{onClose ? (
					<div className="review-modal-close-row">
						<IconButton
							data-initial-focus
							onClick={onClose}
							aria-label={t("ariaLabels.closeReviewDialog")}
							variant="transparent"
						>
							<Xmark />
						</IconButton>
					</div>
				) : null}
			</div>
			<div className="review-card-body">
				<form className="review-form" onSubmit={handleSubmit}>
					<div className="review-field">
						<label
							className="review-field-label text-label"
							htmlFor="recipe-review"
						>
							{t("reviewModal.describeRecipe")}{" "}
							<span className="required-asterisk" aria-hidden="true">
								*
							</span>
						</label>
						<textarea
							id="recipe-review"
							name="review"
							className="review-textarea"
							rows={5}
							maxLength={1000}
							value={review}
							onChange={(event) => setReview(event.target.value)}
						/>
					</div>

					<div className="review-status" aria-live="polite">
						{error ? <p className="review-error">{error}</p> : null}
					</div>

					<p className="review-help-text text-caption">
						{t("reviewModal.existingReviewHint")}
					</p>

					<MainButton
						type="submit"
						className="review-submit"
						disabled={!trimmedReview || isSubmitting}
					>
						{isSubmitting
							? t("reviewModal.submitting")
							: t("reviewModal.submit")}
					</MainButton>
				</form>
			</div>
		</section>
	);
};
