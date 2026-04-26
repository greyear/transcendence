import "~/assets/styles/rating.scss";
import { StarSolid, Xmark } from "iconoir-react";
import {
	type RefObject,
	type SyntheticEvent,
	useEffect,
	useState,
} from "react";
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
	initialRating: number | null;
};

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

const ApiResponseSchema = z.object({
	error: z.string().optional(),
	message: z.string().optional(),
});

export const RatingForm = ({
	dialogRef,
	onClose,
	onSuccess,
	recipeId,
	initialRating,
}: RatingFormProps) => {
	const { t } = useTranslation();
	const [rating, setRating] = useState(initialRating ?? 0);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		setRating(initialRating ?? 0);
		setError("");
	}, [initialRating]);

	const parseApiResponse = async (response: Response) => {
		const body: unknown = await response.json();
		const parsed = ApiResponseSchema.safeParse(body);

		if (!parsed.success) {
			return {};
		}

		return parsed.data;
	};

	const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (rating === 0 || isDeleting) {
			return;
		}

		setError("");
		setIsSubmitting(true);

		try {
			const payload = JSON.stringify({ rating });
			let ratingResponse = await fetch(
				`${API_BASE_URL}/recipes/${recipeId}/rating`,
				{
					method: initialRating === null ? "POST" : "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: payload,
				},
			);
			let ratingData = await parseApiResponse(ratingResponse);

			if (ratingResponse.status === 409 && initialRating === null) {
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

			await onSuccess?.();
			onClose?.();
		} catch (submitError) {
			setError(
				submitError instanceof TypeError
					? t("ratingModal.networkError")
					: t("ratingModal.genericError"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (initialRating === null || isSubmitting) {
			return;
		}

		setError("");
		setIsDeleting(true);

		try {
			const response = await fetch(
				`${API_BASE_URL}/recipes/${recipeId}/rating`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);
			const responseData = await parseApiResponse(response);

			if (!response.ok) {
				setError(responseData.error ?? t("ratingModal.genericError"));
				return;
			}

			setRating(0);
			await onSuccess?.();
			onClose?.();
		} catch (deleteError) {
			setError(
				deleteError instanceof TypeError
					? t("ratingModal.networkError")
					: t("ratingModal.genericError"),
			);
		} finally {
			setIsDeleting(false);
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
							<Xmark aria-hidden="true" />
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
										aria-hidden="true"
									>
										<StarSolid />
									</span>
								</label>
							))}
						</div>
					</div>

					<output
						className="rating-status"
						aria-live="polite"
						aria-atomic="true"
					>
						{error ? <span className="rating-error">{error}</span> : null}
					</output>

					<p className="rating-help-text text-caption">
						{t("ratingModal.averageRatingHint")}
					</p>

					<div className="rating-actions">
						<MainButton
							type="submit"
							className="rating-submit"
							disabled={rating === 0 || isSubmitting || isDeleting}
						>
							{initialRating !== null
								? isSubmitting
									? t("ratingModal.updatingRating")
									: t("ratingModal.updateRating")
								: isSubmitting
									? t("ratingModal.submitting")
									: t("ratingModal.submit")}
						</MainButton>
						{initialRating !== null ? (
							<MainButton
								type="button"
								className="rating-delete"
								variant="danger"
								disabled={isSubmitting || isDeleting}
								onClick={() => void handleDelete()}
							>
								{isDeleting
									? t("ratingModal.deleting")
									: t("ratingModal.deleteRating")}
							</MainButton>
						) : null}
					</div>
				</form>
			</div>
		</section>
	);
};
