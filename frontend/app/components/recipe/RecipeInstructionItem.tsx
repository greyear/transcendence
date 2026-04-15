import type { DraggableProvided } from "@hello-pangea/dnd";
import { Menu, XmarkCircle } from "iconoir-react";

export type InstructionRow = {
	id: string;
	text: string;
};

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
				<textarea
					className="recipe-instruction-textarea"
					value={step.text}
					rows={1}
					onChange={(e) => {
						onChange(e.target.value);
						e.target.style.height = "auto";
						e.target.style.height = `${e.target.scrollHeight}px`;
					}}
					aria-label={`Step ${index + 1} description`}
				/>
				<button
					type="button"
					className="recipe-remove-button"
					onClick={onRemove}
					aria-label={`Remove step ${index + 1}`}
					disabled={isOnly}
				>
					<XmarkCircle aria-hidden="true" />
				</button>
			</div>
		</li>
	);
};
