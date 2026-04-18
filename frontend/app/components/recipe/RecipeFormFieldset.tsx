import type { ReactNode } from "react";

type RecipeFormFieldsetProps = {
	legend: string;
	required?: boolean;
	children: ReactNode;
};

export const RecipeFormFieldset = ({
	legend,
	required,
	children,
}: RecipeFormFieldsetProps) => (
	<fieldset className="recipe-create-fieldset">
		<legend className="recipe-create-label">
			{legend}{" "}
			{required && (
				<span className="recipe-create-required" aria-hidden="true">
					*
				</span>
			)}
		</legend>
		{children}
	</fieldset>
);
