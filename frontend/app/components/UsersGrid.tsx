import { UserCard } from "./cards/UserCard";
import "../assets/styles/usersGrid.css";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { useRelationSet } from "~/composables/useRelationSet";

type UserCardResponse = {
	id: number;
	username: string;
	avatar: string | null;
	recipes_count: number;
};

type UsersGridProps = {
	isAuthenticated: boolean;
	currentUserId: number | null;
	openAuthModal: (onSuccessAction?: () => void) => void;
	showNotice: (message: string) => void;
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
	isAuthenticated,
	currentUserId,
	openAuthModal,
	showNotice,
	page = 1,
	perPage = 12,
	onLoad,
	sortValue = "name-asc",
}: UsersGridProps) => {
	const { t } = useTranslation();
	const [userList, setUserList] = useState<UserCardResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);

	const {
		ids: followingIds,
		pendingIds: pendingFollowIds,
		isListLoading: isFollowingLoading,
		handleToggle: handleFollowToggle,
	} = useRelationSet({
		isAuthenticated,
		openAuthModal,
		listEndpoint: "/users/me/following",
		itemEndpoint: (userId) => `/users/${userId}/follow`,
		onAlreadyMember: () => showNotice(t("notices.alreadyFollowing")),
	});

	useEffect(() => {
		fetch(`${API_BASE_URL}/users`)
			.then((res) => {
				if (!res.ok) {
					const message = `Failed to fetch users: ${res.status}`;
					console.error(message);
					setErrorStatus(res.status);
					return { data: [] };
				}
				return res.json();
			})
			.then((body) => {
				const allUsers: UserCardResponse[] = body.data ?? [];
				onLoad?.(allUsers.length);
				setUserList(allUsers);
			})
			.catch((error: unknown) => {
				console.error(error);
				setErrorStatus("unknown");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [onLoad]);

	const sortedList = useMemo(
		() => sortUsers(userList, sortValue),
		[userList, sortValue],
	);

	const start = (page - 1) * perPage;
	const pageUsers = sortedList.slice(start, start + perPage);

	if (isLoading) {
		return <p className="users-grid-status">{t("usersGrid.loading")}</p>;
	}

	if (errorStatus !== null) {
		return (
			<p className="users-grid-status">
				{t("usersGrid.error", { status: errorStatus })}
			</p>
		);
	}

	if (userList.length === 0) {
		return <p className="users-grid-status">{t("usersGrid.empty")}</p>;
	}

	return (
		<ul className="user-card-list">
			{pageUsers.map(({ id, username, avatar, recipes_count }) => (
				<li key={id}>
					<UserCard
						id={id}
						name={username}
						avatar={avatar}
						recipeCount={recipes_count}
						isFollowing={followingIds.has(id)}
						isFollowPending={isFollowingLoading || pendingFollowIds.has(id)}
						onFollowToggle={handleFollowToggle}
						isOwnCard={currentUserId === id}
					/>
				</li>
			))}
		</ul>
	);
};
