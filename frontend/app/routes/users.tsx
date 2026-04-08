import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import { UsersGrid } from "~/components/UsersGrid";
import "~/assets/styles/users.css";
import { Filter } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { SortMenu } from "~/components/SortMenu";
import { getCurrentPage } from "~/composables/getCurrentPage";
import { useSortOptions } from "~/composables/useSortOptions";
import { useSortParam } from "~/composables/useSortParam";

const PER_PAGE = 12;

const UsersPage = () => {
	const { t } = useTranslation();
	const [activeFilterIndex, setActiveFilterIndex] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [searchParams] = useSearchParams();

	const sortOptions = useSortOptions("users");
	const [sortValue, setSort] = useSortParam(sortOptions[0].value);

	const filters = useMemo(
		() => [
			t("usersPage.tabAll"),
			t("usersPage.tabFollowers"),
			t("usersPage.tabFollowing"),
		],
		[t],
	);

	const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
	const page = getCurrentPage(searchParams, totalPages);

	return (
		<section className="users-page">
			<PageHeader
				title={t("usersPage.title")}
				totalLabel={`${t("usersPage.totalCount")} ${totalCount}`}
			/>

			<SearchField placeholder={t("common.searchPlaceholder")} />

			<FilterList
				filters={filters}
				activeFilter={filters[activeFilterIndex]}
				onFilterChange={(filter) =>
					setActiveFilterIndex(filters.indexOf(filter))
				}
			/>

			<div className="users-page-controls">
				<SortMenu options={sortOptions} value={sortValue} onChange={setSort} />

				<TextIconButton>
					{t("common.filterButton")}
					<Filter />
				</TextIconButton>
			</div>

			<UsersGrid
				page={page}
				perPage={PER_PAGE}
				sortValue={sortValue}
				onLoad={setTotalCount}
			/>

			<Pagination
				totalElementsCount={totalCount}
				elementsPerPage={PER_PAGE}
				totalPagesCount={totalPages}
			/>
		</section>
	);
};

export default UsersPage;
