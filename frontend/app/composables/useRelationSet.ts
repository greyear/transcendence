import { useEffect, useState } from "react";
import { z } from "zod";
import { API_BASE_URL } from "./apiBaseUrl";

/**
 * Shared hook for "viewer's membership in a set of things" relationships —
 * favorites, follows, and similar. Handles:
 *   - auth-gated list fetch that populates a Set<number> of IDs
 *   - optimistic POST/DELETE toggle with rollback on failure (409 treated as success)
 *   - guest handling: opens auth modal, replays the action after login
 *
 * Use `listEndpoint` for grid/list views that know the full membership up front
 * (e.g. `/users/me/favorites`). For single-item pages that already know the
 * relationship from another source, pass `initialIds` instead.
 */
type UseRelationSetOptions = {
	isAuthenticated: boolean;
	openAuthModal: (onSuccessAction?: () => void) => void;
	itemEndpoint: (id: number) => string;
	listEndpoint?: string;
	initialIds?: number[];
};

type UseRelationSetResult = {
	ids: Set<number>;
	pendingIds: Set<number>;
	isListLoading: boolean;
	/** Toggles membership; for guests, opens the auth modal and replays as an add. */
	handleToggle: (id: number, shouldBeMember?: boolean) => void;
};

const IdListResponseSchema = z.object({
	data: z.array(z.object({ id: z.number() })),
});

const updateSetMember = (
	current: Set<number>,
	id: number,
	shouldBeMember: boolean,
): Set<number> => {
	const next = new Set(current);
	if (shouldBeMember) {
		next.add(id);
	} else {
		next.delete(id);
	}
	return next;
};

export const useRelationSet = ({
	isAuthenticated,
	openAuthModal,
	itemEndpoint,
	listEndpoint,
	initialIds,
}: UseRelationSetOptions): UseRelationSetResult => {
	const [ids, setIds] = useState<Set<number>>(() => new Set(initialIds));
	const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
	const [isListLoading, setIsListLoading] = useState(false);

	// Re-seed when the parent-provided initialIds change (e.g. after a profile
	// refetch). Callers should memoize `initialIds` so identity is stable across
	// renders that don't actually change membership.
	useEffect(() => {
		if (listEndpoint) {
			return;
		}
		setIds(new Set(initialIds));
	}, [initialIds, listEndpoint]);

	useEffect(() => {
		if (!listEndpoint) {
			return;
		}
		if (!isAuthenticated) {
			setIds(new Set());
			setIsListLoading(false);
			return;
		}

		let ignore = false;
		setIsListLoading(true);

		fetch(`${API_BASE_URL}${listEndpoint}`, { credentials: "include" })
			.then((res) => (res.ok ? res.json() : null))
			.then((body: unknown) => {
				if (ignore) {
					return;
				}
				const parsed = IdListResponseSchema.safeParse(body);
				setIds(
					parsed.success
						? new Set(parsed.data.data.map((item) => item.id))
						: new Set(),
				);
			})
			.catch((error: unknown) => {
				console.error(error);
				if (!ignore) {
					setIds(new Set());
				}
			})
			.finally(() => {
				if (!ignore) {
					setIsListLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, [isAuthenticated, listEndpoint]);

	const runToggle = async (id: number, shouldBeMember: boolean) => {
		if (pendingIds.has(id)) {
			return;
		}

		setIds((prev) => updateSetMember(prev, id, shouldBeMember));
		setPendingIds((prev) => new Set(prev).add(id));

		try {
			const res = await fetch(`${API_BASE_URL}${itemEndpoint(id)}`, {
				method: shouldBeMember ? "POST" : "DELETE",
				credentials: "include",
			});
			// 409 on POST = already a member; 409 on DELETE = already absent. Both safe.
			if (!res.ok && res.status !== 409) {
				setIds((prev) => updateSetMember(prev, id, !shouldBeMember));
			}
		} catch (error) {
			console.error(error);
			setIds((prev) => updateSetMember(prev, id, !shouldBeMember));
		} finally {
			setPendingIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}
	};

	const handleToggle = (id: number, shouldBeMember?: boolean) => {
		const resolved = shouldBeMember ?? !ids.has(id);
		if (!isAuthenticated) {
			openAuthModal(() => {
				void runToggle(id, true);
			});
			return;
		}
		void runToggle(id, resolved);
	};

	return { ids, pendingIds, isListLoading, handleToggle };
};
