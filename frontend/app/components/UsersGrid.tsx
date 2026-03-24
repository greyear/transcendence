import { UserCard } from "./cards/UserCard";
import "../assets/styles/usersGrid.css";

type UserCardResponse = {
	id: number;
	name: string;
	recipeCount: number;
};

export const UsersGrid = () => {
	// TODO: replace mock data with backend users when endpoint is available
	const userList: UserCardResponse[] = [
		{ id: 1, name: "John", recipeCount: 12 },
		{ id: 2, name: "Emma", recipeCount: 8 },
		{ id: 3, name: "Liam", recipeCount: 15 },
		{ id: 4, name: "Olivia", recipeCount: 5 },
		{ id: 5, name: "Noah", recipeCount: 20 },
	];

	return (
		<ul className="user-card-list">
			{userList.map(({ id, name, recipeCount }) => (
				<li key={id}>
					<UserCard id={id} name={name} recipeCount={recipeCount} />
				</li>
			))}
		</ul>
	);
};
