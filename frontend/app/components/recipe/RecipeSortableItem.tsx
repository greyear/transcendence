import type { DraggableProvided } from "@hello-pangea/dnd";
import { Draggable } from "@hello-pangea/dnd";
import type { ReactNode } from "react";

type RecipeSortableItemProps = {
	id: string;
	index: number;
	children: (provided: DraggableProvided) => ReactNode;
};

export const RecipeSortableItem = ({
	id,
	index,
	children,
}: RecipeSortableItemProps) => (
	<Draggable draggableId={id} index={index}>
		{(provided) => children(provided)}
	</Draggable>
);
