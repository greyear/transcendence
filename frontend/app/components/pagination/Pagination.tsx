import {
	FastArrowLeft,
	FastArrowRight,
	NavArrowLeft,
	NavArrowRight,
} from "iconoir-react";
import { Navigate, useSearchParams } from "react-router";
import "~/assets/styles/pagination.css";
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

const getCurrentPage = (
	searchParams: URLSearchParams,
	totalPagesCount: number,
): number => {
	const pageAttr = searchParams.get("page");
	if (!pageAttr) {
		return 1;
	}

	const page = Number(pageAttr);
	if (Number.isNaN(page) || !Number.isInteger(page) || page < 1) {
		return 1;
	}

	if (page > totalPagesCount) {
		return totalPagesCount;
	}

	return page;
};

export const Pagination = ({ totalPagesCount }: PaginationProps) => {
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
		<nav className="pagination" aria-label="Pagination">
			<ul className="pagination__list">
				<li className="pagination__item">
					<PaginationItem
						to={buildPageUrl(1)}
						variant="nav"
						disabled={currentPage <= 1}
						ariaLabel="First page"
					>
						<FastArrowLeft />
					</PaginationItem>
				</li>

				<li className="pagination__item">
					<PaginationItem
						to={buildPageUrl(currentPage - 1)}
						variant="nav"
						disabled={currentPage <= 1}
						ariaLabel="Previous page"
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
							ariaLabel={`Page ${page}`}
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
						ariaLabel="Next page"
					>
						<NavArrowRight />
					</PaginationItem>
				</li>

				<li className="pagination__item">
					<PaginationItem
						to={buildPageUrl(totalPagesCount)}
						variant="nav"
						disabled={currentPage >= totalPagesCount}
						ariaLabel="Last page"
					>
						<FastArrowRight />
					</PaginationItem>
				</li>
			</ul>
		</nav>
	);
};
