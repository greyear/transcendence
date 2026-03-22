import {
	FastArrowLeft,
	FastArrowRight,
	NavArrowLeft,
	NavArrowRight,
} from "iconoir-react";
import { Link, useSearchParams } from "react-router";
import "~/assets/styles/pagination.css";

export type PaginationProps = {
	totalElementsCount: number;
	elementsPerPage: number;
	totalPagesCount: number;
	type?: "recipe" | "user";
};

function getPageWindow(current: number, total: number, size: number): number[] {
	const clampedSize = Math.min(size, total);
	const half = Math.floor(clampedSize / 2);
	const start = Math.min(Math.max(1, current - half), total - clampedSize + 1);
	return Array.from({ length: clampedSize }, (_, i) => start + i);
}

export const Pagination = ({ totalPagesCount }: PaginationProps) => {
	const [searchParams] = useSearchParams();
	const currentPage = Math.max(1, Number(searchParams.get("page") ?? 1));

	const buildPageUrl = (page: number) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", String(page));
		return `?${params.toString()}`;
	};

	const desktopPages = getPageWindow(currentPage, totalPagesCount, 5);
	const mobilePageSet = new Set(getPageWindow(currentPage, totalPagesCount, 3));

	return (
		<nav className="pagination" aria-label="Pagination">
			<Link
				to={buildPageUrl(1)}
				className={`pagination-item${currentPage <= 1 ? " disabled" : ""}`}
				aria-label="First page"
			>
				<FastArrowLeft />
			</Link>

			<Link
				to={buildPageUrl(currentPage - 1)}
				className={`pagination-item${currentPage <= 1 ? " disabled" : ""}`}
				aria-label="Previous page"
			>
				<NavArrowLeft />
			</Link>

			{desktopPages.map((page) => (
				<Link
					key={page}
					to={buildPageUrl(page)}
					className={`pagination-item${page === currentPage ? " active" : ""}${
						!mobilePageSet.has(page) ? " hide-mobile" : ""
					}`}
					aria-label={`Page ${page}`}
					aria-current={page === currentPage ? "page" : undefined}
				>
					{page}
				</Link>
			))}

			<Link
				to={buildPageUrl(currentPage + 1)}
				className={`pagination-item${currentPage >= totalPagesCount ? " disabled" : ""}`}
				aria-label="Next page"
			>
				<NavArrowRight />
			</Link>

			<Link
				to={buildPageUrl(totalPagesCount)}
				className={`pagination-item${currentPage >= totalPagesCount ? " disabled" : ""}`}
				aria-label="Last page"
			>
				<FastArrowRight />
			</Link>
		</nav>
	);
};
