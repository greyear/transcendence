import { PlusCircle } from "iconoir-react";
import { useTranslation } from "react-i18next";

type RecipePhotoUploadProps = {
	photoPreview: string | null;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const RecipePhotoUpload = ({
	photoPreview,
	onChange,
}: RecipePhotoUploadProps) => {
	const { t } = useTranslation();
	return (
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
				accept="image/*"
				className="recipe-photo-input"
				onChange={onChange}
			/>
		</label>
	);
};
