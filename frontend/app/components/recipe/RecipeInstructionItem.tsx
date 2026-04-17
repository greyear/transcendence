import type { DraggableProvided } from "@hello-pangea/dnd";
import { Menu, XmarkCircle } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "~/components/buttons/IconButton";
import { TextArea } from "~/components/inputs/TextArea";

export type InstructionRow = {
	id: string;
	text: string;
};

export const createInstruction = (): InstructionRow => ({
	id: crypto.randomUUID(),
	text: "",
});

type RecipeInstructionItemProps = {
	step: InstructionRow;
	provided: DraggableProvided;
	index: number;
	isOnly: boolean;
	onChange: (value: string) => void;
	onRemove: () => void;
};

export const RecipeInstructionItem = ({
	step,
	provided,
	index,
	isOnly,
	onChange,
	onRemove,
}: RecipeInstructionItemProps) => {
	const { t } = useTranslation();
	const number = index + 1;
	return (
		<li
			ref={provided.innerRef}
			{...provided.draggableProps}
			className="recipe-instruction-item"
		>
			<span className="recipe-step-label text-caption">
				{t("recipeCreateAria.stepLabel", { number })}
			</span>
			<div className="recipe-instruction-row">
				<button
					type="button"
					className="recipe-drag-handle"
					{...provided.dragHandleProps}
					aria-label={t("recipeCreateAria.reorderStep", { number })}
				>
					<Menu aria-hidden="true" />
				</button>
				<TextArea
					id={step.id}
					wrapperClassName="recipe-instruction-body"
					className="recipe-instruction-textarea text-body3"
					value={step.text}
					onChange={onChange}
					placeholder={t("recipeCreatePage.instructionPlaceholder")}
					required
					rows={1}
					aria-label={t("recipeCreateAria.stepDescription", { number })}
				/>
				<IconButton
					variant="transparent"
					className="recipe-remove-button"
					onClick={onRemove}
					aria-label={t("recipeCreateAria.removeStep", { number })}
					disabled={isOnly}
				>
					<XmarkCircle aria-hidden="true" />
				</IconButton>
			</div>
		</li>
	);
};
