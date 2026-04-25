import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import "~/assets/styles/cooksRow.scss";
import { getScrollAmount } from "~/composables/getScrollAmount";
import { useTopCooks } from "~/composables/useTopCooks";
import { CookCard } from "./cards/CookCard";

const EDGE_TOLERANCE_PX = 4;

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

export const CooksRow = forwardRef<CooksRowHandle, CooksRowProps>(
	({ onScrollStateChange }, ref) => {
		const { t } = useTranslation();
		const listRef = useRef<HTMLUListElement | null>(null);
		const { cookList, isLoading, errorStatus } = useTopCooks();
		const [canScrollLeft, setCanScrollLeft] = useState(false);
		const [canScrollRight, setCanScrollRight] = useState(false);

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
			if (cookList.length === 0) {
				return;
			}

			listRef.current?.scrollTo({ left: 0, behavior: "auto" });
		}, [cookList.length]);

		useEffect(() => {
			const list = listRef.current;

			if (!list || cookList.length === 0) {
				return;
			}

			const updateScrollState = () => {
				const { clientWidth, scrollWidth, scrollLeft } = list;

				setCanScrollLeft(scrollLeft > EDGE_TOLERANCE_PX);
				setCanScrollRight(
					scrollLeft + clientWidth < scrollWidth - EDGE_TOLERANCE_PX,
				);
			};

			updateScrollState();

			list.addEventListener("scroll", updateScrollState, { passive: true });
			window.addEventListener("resize", updateScrollState);

			return () => {
				list.removeEventListener("scroll", updateScrollState);
				window.removeEventListener("resize", updateScrollState);
			};
		}, [cookList.length]);

		useEffect(() => {
			onScrollStateChange?.({ canScrollLeft, canScrollRight });
		}, [canScrollLeft, canScrollRight, onScrollStateChange]);

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

		return (
			<div
				className={`cooks-row-wrapper${canScrollLeft ? " has-left-fade" : ""}${canScrollRight ? " has-right-fade" : ""}`}
			>
				<ul className="cooks-row" ref={listRef}>
					{cookList.map(({ id, username, avatar }) => (
						<li key={id}>
							<CookCard id={id} username={username} avatar={avatar} />
						</li>
					))}
				</ul>
			</div>
		);
	},
);
