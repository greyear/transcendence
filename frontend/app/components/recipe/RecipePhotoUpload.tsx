import { PlusCircle } from "iconoir-react";
import { useTranslation } from "react-i18next";

type RecipePhotoUploadProps = {
	photoPreview: string | null;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	error?: string;
};

export const RecipePhotoUpload = ({
	photoPreview,
	onChange,
	error = "",
}: RecipePhotoUploadProps) => {
	const { t } = useTranslation();
	return (
		<div>
			<label
				htmlFor="recipe-photo"
				className="recipe-photo-upload"
				aria-label={t("recipeCreateAria.addPhoto")}
			>
				{photoPreview ? (
					<img
						src={photoPreview}
						alt={t("recipeCreatePage.recipePreview")}
						className="recipe-photo-preview"
					/>
				) : (
					<span className="recipe-photo-button">
						<PlusCircle aria-hidden="true" />
						{t("recipeCreatePage.addPhoto")}
					</span>
				)}
				<input
					id="recipe-photo"
					type="file"
					accept="image/jpeg,image/png,image/webp"
					className="recipe-photo-input"
					onChange={onChange}
				/>
			</label>
			{error ? (
				<p className="recipe-create-error" aria-live="polite">
					{error}
				</p>
			) : null}
		</div>
	);
};
