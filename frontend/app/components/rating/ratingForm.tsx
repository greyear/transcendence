import "~/assets/styles/rating.css";
import { StarSolid, Xmark } from "iconoir-react";
import { type FormEvent, type RefObject, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "~/components/buttons/IconButton";
import { MainButton } from "~/components/buttons/MainButton";

type RatingFormProps = {
	dialogRef?: RefObject<HTMLElement | null>;
	onClose?: () => void;
};

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

export const RatingForm = ({ dialogRef, onClose }: RatingFormProps) => {
	const { t } = useTranslation();
	const [rating, setRating] = useState(0);
	const [review, setReview] = useState("");

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (rating === 0) {
			return;
		}

		// TODO: Add submit logic
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
							value={review}
							onChange={(event) => setReview(event.target.value)}
						/>
					</div>

					<MainButton
						type="submit"
						className="rating-submit"
						disabled={rating === 0}
					>
						{t("ratingModal.submit")}
					</MainButton>
				</form>
			</div>
		</section>
	);
};
