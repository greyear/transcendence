import {
	FastArrowLeft,
	FastArrowRight,
	NavArrowLeft,
	NavArrowRight,
} from "iconoir-react";
import { useSearchParams } from "react-router";
import "~/assets/styles/pagination.css";
import { PaginationItem } from "./PaginationItem";

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
			<PaginationItem
				to={buildPageUrl(1)}
				variant="nav"
				disabled={currentPage <= 1}
				ariaLabel="First page"
			>
				<FastArrowLeft />
			</PaginationItem>

			<PaginationItem
				to={buildPageUrl(currentPage - 1)}
				variant="nav"
				disabled={currentPage <= 1}
				ariaLabel="Previous page"
			>
				<NavArrowLeft />
			</PaginationItem>

			{desktopPages.map((page) => (
				<PaginationItem
					key={page}
					to={buildPageUrl(page)}
					variant="page"
					active={page === currentPage}
					hideMobile={!mobilePageSet.has(page)}
					ariaLabel={`Page ${page}`}
					ariaCurrentPage={page === currentPage}
				>
					{page}
				</PaginationItem>
			))}

			<PaginationItem
				to={buildPageUrl(currentPage + 1)}
				variant="nav"
				disabled={currentPage >= totalPagesCount}
				ariaLabel="Next page"
			>
				<NavArrowRight />
			</PaginationItem>

			<PaginationItem
				to={buildPageUrl(totalPagesCount)}
				variant="nav"
				disabled={currentPage >= totalPagesCount}
				ariaLabel="Last page"
			>
				<FastArrowRight />
			</PaginationItem>
		</nav>
	);
};
