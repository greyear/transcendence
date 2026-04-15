import { Menu, XmarkCircle } from "iconoir-react";

export type InstructionRow = {
	id: string;
	text: string;
};

type RecipeInstructionItemProps = {
	step: InstructionRow;
	index: number;
	isOnly: boolean;
	onDragHandlePointerDown: () => void;
	onPointerUp: () => void;
	onDragStart: (e: React.DragEvent<HTMLLIElement>) => void;
	onDragOver: (e: React.DragEvent<HTMLLIElement>) => void;
	onDragEnd: () => void;
	onChange: (value: string) => void;
	onRemove: () => void;
};

export const RecipeInstructionItem = ({
	step,
	index,
	isOnly,
	onDragHandlePointerDown,
	onPointerUp,
	onDragStart,
	onDragOver,
	onDragEnd,
	onChange,
	onRemove,
}: RecipeInstructionItemProps) => {
	return (
		<li
			className="recipe-instruction-item"
			draggable
			onPointerUp={onPointerUp}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragEnd={onDragEnd}
		>
			<span className="recipe-step-label text-caption">Step {index + 1}</span>
			<div className="recipe-instruction-row">
				<span
					className="recipe-drag-handle"
					aria-hidden="true"
					onPointerDown={onDragHandlePointerDown}
				>
					<Menu />
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
