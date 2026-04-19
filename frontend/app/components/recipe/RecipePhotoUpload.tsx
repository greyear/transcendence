import { PlusCircle } from "iconoir-react";

type RecipePhotoUploadProps = {
	photoPreview: string | null;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const RecipePhotoUpload = ({
	photoPreview,
	onChange,
}: RecipePhotoUploadProps) => {
	return (
		<label
			htmlFor="recipe-photo"
			className="recipe-photo-upload"
			aria-label="Add a recipe photo"
		>
			{photoPreview ? (
				<img
					src={photoPreview}
					alt="Recipe preview"
					className="recipe-photo-preview"
				/>
			) : (
				<span className="recipe-photo-button">
					<PlusCircle aria-hidden="true" />
					Add a photo
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
