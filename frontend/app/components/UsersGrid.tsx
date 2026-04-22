import { UserCard } from "./cards/UserCard";
import "../assets/styles/usersGrid.css";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { MainButton } from "~/components/buttons/MainButton";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { useRelationSet } from "~/composables/useRelationSet";

type UserCardResponse = {
	id: number;
	username: string;
	avatar: string | null;
	recipes_count: number;
};

export const UsersTabSchema = z.enum(["all", "followers", "following"]);
export type UsersTab = z.infer<typeof UsersTabSchema>;

type UsersGridProps = {
	isAuthenticated: boolean;
	currentUserId: number | null;
	openAuthModal: (onSuccessAction?: () => void) => void;
	showNotice: (message: string) => void;
	sortValue?: string;
	page?: number;
	perPage?: number;
	onLoad?: (totalCount: number) => void;
	tab?: UsersTab;
};

const UserListItemSchema = z.object({
	id: z.number(),
	username: z.string(),
	avatar: z.string().nullable(),
	recipes_count: z.coerce.number(),
});

const UserListResponseSchema = z.object({
	data: z.array(UserListItemSchema),
});

const tabRequiresAuth = (tab: UsersTab): boolean =>
	tab === "followers" || tab === "following";

const resolveEndpoint = (tab: UsersTab): string => {
	if (tab === "followers") {
		return `${API_BASE_URL}/users/me/followers`;
	}
	if (tab === "following") {
		return `${API_BASE_URL}/users/me/following`;
	}
	return `${API_BASE_URL}/users`;
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
	tab = "all",
}: UsersGridProps) => {
	const { t } = useTranslation();
	const [userList, setUserList] = useState<UserCardResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<
		number | "unknown" | "auth-required" | null
	>(null);

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

	const isAuthGated = tabRequiresAuth(tab) && !isAuthenticated;

	useEffect(() => {
		setErrorStatus(null);

		if (isAuthGated) {
			setUserList([]);
			onLoad?.(0);
			setIsLoading(false);
			setErrorStatus("auth-required");
			return;
		}

		setIsLoading(true);

		const endpoint = resolveEndpoint(tab);
		const requiresCredentials = tabRequiresAuth(tab);

		fetch(
			endpoint,
			requiresCredentials ? { credentials: "include" } : undefined,
		)
			.then(async (res) => {
				if (!res.ok) {
					const message = `Failed to fetch users: ${res.status}`;
					console.error(message);
					setErrorStatus(res.status);
					return null;
				}
				const body: unknown = await res.json();
				return body;
			})
			.then((body) => {
				if (body === null) {
					onLoad?.(0);
					setUserList([]);
					return;
				}
				const parsed = UserListResponseSchema.safeParse(body);
				const allUsers = parsed.success ? parsed.data.data : [];
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
	}, [onLoad, tab, isAuthGated]);

	const sortedList = useMemo(
		() => sortUsers(userList, sortValue),
		[userList, sortValue],
	);

	const start = (page - 1) * perPage;
	const pageUsers = sortedList.slice(start, start + perPage);

	if (isLoading) {
		return <p className="users-grid-status">{t("usersGrid.loading")}</p>;
	}

	if (errorStatus === "auth-required") {
		return (
			<div className="users-grid-status">
				<p>{t("usersGrid.signInRequired")}</p>
				<MainButton onClick={() => openAuthModal()}>
					{t("common.signInButton")}
				</MainButton>
			</div>
		);
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
