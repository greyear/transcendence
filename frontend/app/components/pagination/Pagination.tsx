import {
	FastArrowLeft,
	FastArrowRight,
	NavArrowLeft,
	NavArrowRight,
} from "iconoir-react";
import { Navigate, useSearchParams } from "react-router";
import "~/assets/styles/pagination.css";
import { useTranslation } from "react-i18next";
import { getCurrentPage } from "~/composables/getCurrentPage";
import { PaginationItem } from "./PaginationItem";

export type PaginationProps = {
	totalElementsCount: number;
	elementsPerPage: number;
	totalPagesCount: number;
	type?: "recipe" | "user";
};

const getPageWindow = (
	current: number,
	total: number,
	size: number,
): number[] => {
	const clampedSize = Math.min(size, total);
	const half = Math.floor(clampedSize / 2);
	const start = Math.min(Math.max(1, current - half), total - clampedSize + 1);
	return Array.from({ length: clampedSize }, (_, i) => start + i);
};

export const Pagination = ({ totalPagesCount }: PaginationProps) => {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const currentPage = getCurrentPage(searchParams, totalPagesCount);

	if (totalPagesCount <= 1) {
		return null;
	}

	const pageAttr = searchParams.get("page");
	if (pageAttr !== null && Number(pageAttr) !== currentPage) {
		const correctedParams = new URLSearchParams(searchParams);
		correctedParams.set("page", String(currentPage));
		return <Navigate to={`?${correctedParams.toString()}`} replace />;
	}

	const buildPageUrl = (page: number) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", String(page));
		return `?${params.toString()}`;
	};

	const desktopPages = getPageWindow(currentPage, totalPagesCount, 5);
	const mobilePageSet = new Set(getPageWindow(currentPage, totalPagesCount, 3));

	return (
		<nav className="pagination" aria-label={t("ariaLabels.pagination")}>
			<ul className="pagination__list">
				<li className="pagination__item">
					<PaginationItem
						to={buildPageUrl(1)}
						variant="nav"
						disabled={currentPage <= 1}
						ariaLabel={t("ariaLabels.firstPage")}
					>
						<FastArrowLeft />
					</PaginationItem>
				</li>

				<li className="pagination__item">
					<PaginationItem
						to={buildPageUrl(currentPage - 1)}
						variant="nav"
						disabled={currentPage <= 1}
						ariaLabel={t("ariaLabels.previousPage")}
					>
						<NavArrowLeft />
					</PaginationItem>
				</li>

				{desktopPages.map((page) => (
					<li
						key={page}
						className={[
							"pagination__item",
							!mobilePageSet.has(page) && "pagination__item--hidden",
						]
							.filter(Boolean)
							.join(" ")}
					>
						<PaginationItem
							to={buildPageUrl(page)}
							variant="page"
							active={page === currentPage}
							ariaLabel={t("ariaLabels.page", { page })}
							ariaCurrentPage={page === currentPage}
						>
							{page}
						</PaginationItem>
					</li>
				))}

				<li className="pagination__item">
					<PaginationItem
						to={buildPageUrl(currentPage + 1)}
						variant="nav"
						disabled={currentPage >= totalPagesCount}
						ariaLabel={t("ariaLabels.nextPage")}
					>
						<NavArrowRight />
					</PaginationItem>
				</li>

				<li className="pagination__item">
					<PaginationItem
						to={buildPageUrl(totalPagesCount)}
						variant="nav"
						disabled={currentPage >= totalPagesCount}
						ariaLabel={t("ariaLabels.lastPage")}
					>
						<FastArrowRight />
					</PaginationItem>
				</li>
			</ul>
		</nav>
	);
};
