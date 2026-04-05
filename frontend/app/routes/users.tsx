import { useState } from "react";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { UsersGrid } from "~/components/UsersGrid";
import "~/assets/styles/users.css";
import { Filter } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { SortMenu } from "~/components/SortMenu";
import { useSortOptions } from "~/composables/useSortOptions";
import { useSortParam } from "~/composables/useSortParam";

const UsersPage = () => {
	const { t } = useTranslation();
	const [activeFilterIndex, setActiveFilterIndex] = useState(0);
	const sortOptions = useSortOptions("users");
	const [sortValue, setSort] = useSortParam(sortOptions[0].value);

	const filters = [
		t("usersPage.tabAll"),
		t("usersPage.tabFollowers"),
		t("usersPage.tabFollowing"),
	];

	return (
		<section className="users-page">
			<PageHeader
				title={t("usersPage.title")}
				totalLabel={`${t("usersPage.totalCount")} 37`}
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

			<UsersGrid sortValue={sortValue} />
		</section>
	);
};

export default UsersPage;
