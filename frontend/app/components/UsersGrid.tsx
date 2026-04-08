import { UserCard } from "./cards/UserCard";
import "../assets/styles/usersGrid.css";
import { useEffect, useMemo, useState } from "react";

type UserCardResponse = {
	id: number;
	username: string;
	recipes_count: number;
};

type UsersGridProps = {
	sortValue?: string;
	page?: number;
	perPage?: number;
	onLoad?: (totalCount: number) => void;
};

const sortUsers = (
	users: UserCardResponse[],
	sortValue: string,
): UserCardResponse[] => {
	const sorted = [...users];

	switch (sortValue) {
		case "name-asc":
			return sorted.sort((a, b) => a.username.localeCompare(b.username));
		case "name-desc":
			return sorted.sort((a, b) => b.username.localeCompare(a.username));
		case "recipes-asc":
			return sorted.sort((a, b) => a.recipes_count - b.recipes_count);
		case "recipes-desc":
			return sorted.sort((a, b) => b.recipes_count - a.recipes_count);
		default:
			return sorted;
	}
};

export const UsersGrid = ({
	page = 1,
	perPage = 12,
	onLoad,
	sortValue = "name-asc",
}: UsersGridProps) => {
	const [userList, setUserList] = useState<UserCardResponse[]>([]);

	useEffect(() => {
		fetch("http://localhost:3000/users")
			.then((res) => {
				if (!res.ok) {
					console.log("The user database is empty.");
					return { data: [] };
				}
				return res.json();
			})
			.then((body) => {
				const allUsers: UserCardResponse[] = body.data ?? [];
				onLoad?.(allUsers.length);
				setUserList(allUsers);
			})
			.catch(console.error);
	}, [onLoad]);

	const sortedList = useMemo(
		() => sortUsers(userList, sortValue),
		[userList, sortValue],
	);

	const start = (page - 1) * perPage;
	const pageUsers = sortedList.slice(start, start + perPage);

	return (
		<ul className="user-card-list">
			{pageUsers.map(({ id, username, recipes_count }) => (
				<li key={id}>
					<UserCard id={id} name={username} recipeCount={recipes_count} />
				</li>
			))}
		</ul>
	);
};
