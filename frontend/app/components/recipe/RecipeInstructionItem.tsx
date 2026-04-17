import type { DraggableProvided } from "@hello-pangea/dnd";
import { Menu, XmarkCircle } from "iconoir-react";
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
	return (
		<li
			ref={provided.innerRef}
			{...provided.draggableProps}
			className="recipe-instruction-item"
		>
			<span className="recipe-step-label text-caption">Step {index + 1}</span>
			<div className="recipe-instruction-row">
				<span className="recipe-drag-handle" {...provided.dragHandleProps}>
					<Menu aria-hidden="true" />
				</span>
				<TextArea
					id={step.id}
					wrapperClassName="recipe-instruction-body"
					className="recipe-instruction-textarea text-body3"
					value={step.text}
					onChange={onChange}
					placeholder="Describe this step…"
					required
					rows={1}
					aria-label={`Step ${index + 1} description`}
				/>
				<IconButton
					variant="transparent"
					className="recipe-remove-button"
					onClick={onRemove}
					aria-label={`Remove step ${index + 1}`}
					disabled={isOnly}
				>
					<XmarkCircle aria-hidden="true" />
				</IconButton>
			</div>
		</li>
	);
};
