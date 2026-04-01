import { CookCard } from "./cards/CookCard";
import "~/assets/styles/cooksRow.css";

type Cook = {
	id: number;
	name: string;
	recipeCount: number;
	image?: string;
};

type CooksRowProps = {
	cooks?: Cook[];
};

const cookList: Cook[] = [
	{ id: 1, name: "Anna", recipeCount: 12 },
	{ id: 2, name: "Mike", recipeCount: 9 },
	{ id: 3, name: "Sara", recipeCount: 15 },
	{ id: 4, name: "Liam", recipeCount: 7 },
	{ id: 5, name: "Ella", recipeCount: 11 },
	{ id: 6, name: "Noah", recipeCount: 8 },
	{ id: 7, name: "Olivia", recipeCount: 10 },
	{ id: 8, name: "Elias", recipeCount: 6 },
	{ id: 9, name: "Ava", recipeCount: 14 },
	{ id: 10, name: "Leo", recipeCount: 13 },
	{ id: 11, name: "Mila", recipeCount: 5 },
	{ id: 12, name: "Lucas", recipeCount: 16 },
];

export const CooksRow = ({ cooks = cookList }: CooksRowProps) => {
	const visibleCooks = [...cooks].sort((a, b) => b.recipeCount - a.recipeCount);

	return (
		<ul className="cooks-grid">
			{visibleCooks.map((cook) => (
				<li key={cook.id}>
					<CookCard {...cook} />
				</li>
			))}
		</ul>
	);
};
