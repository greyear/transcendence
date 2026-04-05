import { UserCard } from "./cards/UserCard";
import "../assets/styles/usersGrid.css";

type UserCardResponse = {
	id: number;
	name: string;
	recipeCount: number;
};

type UsersGridProps = {
	sortValue?: string;
};

const sortUsers = (
	users: UserCardResponse[],
	sortValue: string,
): UserCardResponse[] => {
	const sorted = [...users];
	switch (sortValue) {
		case "name-asc":
			return sorted.sort((a, b) => a.name.localeCompare(b.name));
		case "name-desc":
			return sorted.sort((a, b) => b.name.localeCompare(a.name));
		case "recipes-asc":
			return sorted.sort((a, b) => a.recipeCount - b.recipeCount);
		case "recipes-desc":
			return sorted.sort((a, b) => b.recipeCount - a.recipeCount);
		default:
			return sorted;
	}
};

export const UsersGrid = ({ sortValue = "name-asc" }: UsersGridProps) => {
	// TODO: replace mock data with backend users when endpoint is available
	const userList: UserCardResponse[] = [
		{ id: 1, name: "John", recipeCount: 12 },
		{ id: 2, name: "Emma", recipeCount: 8 },
		{ id: 3, name: "Liam", recipeCount: 15 },
		{ id: 4, name: "Olivia", recipeCount: 5 },
		{ id: 5, name: "Noah", recipeCount: 20 },
	];

	const sorted = sortUsers(userList, sortValue);

	return (
		<ul className="user-card-list">
			{sorted.map(({ id, name, recipeCount }) => (
				<li key={id}>
					<UserCard id={id} name={name} recipeCount={recipeCount} />
				</li>
			))}
		</ul>
	);
};
