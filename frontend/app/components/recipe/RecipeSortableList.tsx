import { Droppable } from "@hello-pangea/dnd";
import type { ReactNode } from "react";

type RecipeSortableListProps = {
	droppableId: string;
	type: string;
	ordered?: boolean;
	className: string;
	ariaLabel?: string;
	children: ReactNode;
};

export const RecipeSortableList = ({
	droppableId,
	type,
	ordered,
	className,
	ariaLabel,
	children,
}: RecipeSortableListProps) => (
	<Droppable droppableId={droppableId} type={type}>
		{(provided) =>
			ordered ? (
				<ol
					ref={provided.innerRef}
					{...provided.droppableProps}
					className={className}
					aria-label={ariaLabel}
				>
					{children}
					{provided.placeholder}
				</ol>
			) : (
				<ul
					ref={provided.innerRef}
					{...provided.droppableProps}
					className={className}
					aria-label={ariaLabel}
				>
					{children}
					{provided.placeholder}
				</ul>
			)
		}
	</Droppable>
);
