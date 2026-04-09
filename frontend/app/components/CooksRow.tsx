import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { CookCard } from "./cards/CookCard";
import "~/assets/styles/cooksRow.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

type CookCardResponse = {
	id: number;
	username: string;
	avatar: string | null;
	recipes_count: number;
};

type CooksRowProps = {
	onScrollStateChange?: (state: {
		canScrollLeft: boolean;
		canScrollRight: boolean;
	}) => void;
};

export type CooksRowHandle = {
	scrollLeft: () => void;
	scrollRight: () => void;
};

const getScrollAmount = (list: HTMLUListElement | null) => {
	if (!list) {
		return 240;
	}

	const firstItem = list.querySelector("li");

	if (!firstItem) {
		return Math.max(list.clientWidth * 0.8, 240);
	}

	const styles = window.getComputedStyle(list);
	const gap = Number.parseFloat(styles.columnGap || styles.gap || "0");
	const itemWidth = firstItem.getBoundingClientRect().width;
	const step = itemWidth + gap;

	if (step <= 0) {
		return Math.max(list.clientWidth * 0.8, 240);
	}

	const visibleItems = Math.max(1, Math.floor((list.clientWidth + gap) / step));

	return visibleItems * step;
};


export const CooksRow = forwardRef<CooksRowHandle, CooksRowProps>(
	({ cooks = cookList, onScrollStateChange }, ref) => {
	const { t } = useTranslation();
	const [cookList, setCookList] = useState<CookCardResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);

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
				const allCooks: CookCardResponse[] = body.data ?? [];
				const sortedCooks = [...allCooks].sort(
					(a, b) => b.recipes_count - a.recipes_count,
				);
				setCookList(sortedCooks);
			})
			.catch((error: unknown) => {
				console.error(error);
				setErrorStatus("unknown");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	if (isLoading) {
		return <p className="cooks-row-status">{t("cooksRow.loading")}</p>;
	}

	if (errorStatus !== null) {
		return (
			<p className="cooks-row-status">
				{t("cooksRow.error", { status: errorStatus })}
			</p>
		);
	}

	if (cookList.length === 0) {
		return <p className="cooks-row-status">{t("cooksRow.empty")}</p>;
	}

	const visibleCooks = [...cooks].sort((a, b) => b.recipeCount - a.recipeCount);
	const listRef = useRef<HTMLUListElement | null>(null);
		const [hasLeftFade, setHasLeftFade] = useState(false);
		const [hasRightFade, setHasRightFade] = useState(false);

		useImperativeHandle(ref, () => ({
			scrollLeft: () => {
				listRef.current?.scrollBy({
					left: -getScrollAmount(listRef.current),
					behavior: "smooth",
				});
			},
			scrollRight: () => {
				listRef.current?.scrollBy({
					left: getScrollAmount(listRef.current),
					behavior: "smooth",
				});
			},
		}));

		useLayoutEffect(() => {
			const list = listRef.current;

			if (!list) {
				return;
			}

			list.scrollTo({ left: 0, behavior: "auto" });

			const resetAfterLayout = window.requestAnimationFrame(() => {
				list.scrollTo({ left: 0, behavior: "auto" });
			});

			return () => window.cancelAnimationFrame(resetAfterLayout);
		}, [visibleCooks.length]);

		useEffect(() => {
			const list = listRef.current;

			if (!list) {
				return;
			}

			const updateScrollState = () => {
				const { clientWidth, scrollWidth } = list;
				const firstItem = list.querySelector("li");
				const edgeThreshold = 4;
				const listLeft = list.getBoundingClientRect().left;
				const firstItemLeft = firstItem?.getBoundingClientRect().left ?? listLeft;
				const canScrollLeft = firstItemLeft < listLeft - edgeThreshold;
				const canScrollRight =
					list.scrollLeft + clientWidth < scrollWidth - edgeThreshold;

				setHasLeftFade(canScrollLeft);
				setHasRightFade(canScrollRight);
				onScrollStateChange?.({ canScrollLeft, canScrollRight });
			};

			updateScrollState();

			list.addEventListener("scroll", updateScrollState, { passive: true });
			window.addEventListener("resize", updateScrollState);

			return () => {
				list.removeEventListener("scroll", updateScrollState);
				window.removeEventListener("resize", updateScrollState);
			};
		}, [onScrollStateChange, visibleCooks.length]);

	return (
			<div
				className={`cooks-row-wrapper${hasLeftFade ? " has-left-fade" : ""}${hasRightFade ? " has-right-fade" : ""}`}
			>
				<ul className="cooks-row" ref={listRef}>
					{visibleCooks.map((cook) => (
						<li key={cook.id}>
							<CookCard {...cook} />
						</li>
					))}
				</ul>
			</div>
		);
};
