import { UserCard } from "./cards/UserCard";
import "../assets/styles/usersGrid.css";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

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
	sortValue?: string;
	page?: number;
	perPage?: number;
	onLoad?: (totalCount: number) => void;
};

const FollowingResponseSchema = z.object({
	data: z.array(z.object({ id: z.number() })),
});

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

const updateFollowingIds = (
	current: Set<number>,
	userId: number,
	shouldFollow: boolean,
) => {
	const next = new Set(current);
	if (shouldFollow) {
		next.add(userId);
	} else {
		next.delete(userId);
	}
	return next;
};

export const UsersGrid = ({
	isAuthenticated,
	currentUserId,
	openAuthModal,
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
	const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
	const [pendingFollowIds, setPendingFollowIds] = useState<Set<number>>(
		new Set(),
	);
	const [isFollowingLoading, setIsFollowingLoading] = useState(false);

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

	useEffect(() => {
		if (!isAuthenticated) {
			setFollowingIds(new Set());
			setIsFollowingLoading(false);
			return;
		}

		let ignore = false;
		setIsFollowingLoading(true);

		fetch(`${API_BASE_URL}/users/me/following`, {
			credentials: "include",
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((body: unknown) => {
				if (ignore) {
					return;
				}
				const parsed = FollowingResponseSchema.safeParse(body);
				setFollowingIds(
					parsed.success
						? new Set(parsed.data.data.map((user) => user.id))
						: new Set(),
				);
			})
			.catch((error: unknown) => {
				console.error(error);
				if (!ignore) {
					setFollowingIds(new Set());
				}
			})
			.finally(() => {
				if (!ignore) {
					setIsFollowingLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, [isAuthenticated]);

	const toggleFollow = async (userId: number, shouldFollow: boolean) => {
		if (pendingFollowIds.has(userId)) {
			return;
		}

		setFollowingIds((prev) => updateFollowingIds(prev, userId, shouldFollow));
		setPendingFollowIds((prev) => new Set(prev).add(userId));

		try {
			const res = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
				method: shouldFollow ? "POST" : "DELETE",
				credentials: "include",
			});
			if (!res.ok && res.status !== 409) {
				setFollowingIds((prev) =>
					updateFollowingIds(prev, userId, !shouldFollow),
				);
			}
		} catch (error) {
			console.error(error);
			setFollowingIds((prev) =>
				updateFollowingIds(prev, userId, !shouldFollow),
			);
		} finally {
			setPendingFollowIds((prev) => {
				const next = new Set(prev);
				next.delete(userId);
				return next;
			});
		}
	};

	const handleFollowToggle = (userId: number, shouldFollow: boolean) => {
		if (!isAuthenticated) {
			openAuthModal(() => {
				void toggleFollow(userId, true);
			});
			return;
		}
		void toggleFollow(userId, shouldFollow);
	};

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
						showFollowButton={currentUserId !== id}
					/>
				</li>
			))}
		</ul>
	);
};
