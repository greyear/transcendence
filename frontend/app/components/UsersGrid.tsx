import { UserCard } from "./cards/UserCard";
import "../assets/styles/usersGrid.scss";
import { useEffect, useRef, useState } from "react";
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
	total_count: z.number().optional(),
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

	// Stash `onLoad` in a ref so an inline `(n) => ...` callback from a parent
	// doesn't retrigger the fetch effect on every render.
	const onLoadRef = useRef(onLoad);
	useEffect(() => {
		onLoadRef.current = onLoad;
	}, [onLoad]);

	useEffect(() => {
		setErrorStatus(null);

		if (isAuthGated) {
			setUserList([]);
			onLoadRef.current?.(0);
			setIsLoading(false);
			setErrorStatus("auth-required");
			return;
		}

		setIsLoading(true);

		const baseEndpoint = resolveEndpoint(tab);
		const requiresCredentials = tabRequiresAuth(tab);

		const params = new URLSearchParams();
		params.set("page", String(page));
		params.set("per_page", String(perPage));
		if (sortValue) {
			params.set("sort", sortValue);
		}

		fetch(
			`${baseEndpoint}?${params}`,
			requiresCredentials ? { credentials: "include" } : undefined,
		)
			.then(async (res) => {
				if (!res.ok) {
					setErrorStatus(res.status);
					return null;
				}
				const body: unknown = await res.json();
				return body;
			})
			.then((body) => {
				if (body === null) {
					onLoadRef.current?.(0);
					setUserList([]);
					return;
				}
				const parsed = UserListResponseSchema.safeParse(body);
				const users = parsed.success ? parsed.data.data : [];
				const total = parsed.success
					? (parsed.data.total_count ?? users.length)
					: 0;
				onLoadRef.current?.(total);
				setUserList(users);
			})
			.catch(() => {
				setErrorStatus("unknown");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [tab, isAuthGated, page, perPage, sortValue]);

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
			{userList.map(({ id, username, avatar, recipes_count }) => (
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
