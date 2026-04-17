import type { ReactNode } from "react";

type RecipeFormFieldProps = {
	label: string;
	htmlFor: string;
	required?: boolean;
	children: ReactNode;
};

export const RecipeFormField = ({
	label,
	htmlFor,
	required,
	children,
}: RecipeFormFieldProps) => (
	<div className="recipe-create-field">
		<label htmlFor={htmlFor} className="recipe-create-label">
			{label}{" "}
			{required && (
				<span className="recipe-create-required" aria-hidden="true">
					*
				</span>
			)}
		</label>
		{children}
	</div>
);
