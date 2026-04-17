import { Droppable } from "@hello-pangea/dnd";
import type { ReactNode } from "react";

type RecipeSortableListProps = {
	droppableId: string;
	type: string;
	className: string;
	ariaLabel?: string;
	children: ReactNode;
};

export const RecipeSortableList = ({
	droppableId,
	type,
	className,
	ariaLabel,
	children,
}: RecipeSortableListProps) => (
	<Droppable droppableId={droppableId} type={type}>
		{(provided) => (
			<ol
				ref={provided.innerRef}
				{...provided.droppableProps}
				className={className}
				aria-label={ariaLabel}
			>
				{children}
				{provided.placeholder}
			</ol>
		)}
	</Droppable>
);
