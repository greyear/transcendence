import { useState } from "react";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { UsersGrid } from "~/components/UsersGrid";
import "~/assets/styles/users.css";
import { Filter, Sort } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { TextIconButton } from "~/components/buttons/TextIconButton";

const UsersPage = () => {
	const { t } = useTranslation();
	const [activeFilterIndex, setActiveFilterIndex] = useState(0);

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
				activeIndex={activeFilterIndex}
				onFilterChange={setActiveFilterIndex}
			/>

			<div className="users-page-controls">
				<TextIconButton>
					{t("common.sortButton")}
					<Sort />
				</TextIconButton>

				<TextIconButton>
					{t("common.filterButton")}
					<Filter />
				</TextIconButton>
			</div>

			<UsersGrid />
		</section>
	);
};

export default UsersPage;
