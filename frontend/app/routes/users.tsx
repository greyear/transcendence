import { useMemo, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import {
	UsersGrid,
	type UsersTab,
	UsersTabSchema,
} from "~/components/UsersGrid";
import "~/assets/styles/users.css";
import { Filter } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { SortMenu } from "~/components/SortMenu";
import { getCurrentPage } from "~/composables/getCurrentPage";
import { useSortOptions } from "~/composables/useSortOptions";
import { useSortParam } from "~/composables/useSortParam";
import type { LayoutOutletContext } from "~/layouts/layout";

const PER_PAGE = 12;

const UsersPage = () => {
	const { t } = useTranslation();
	const { isAuthenticated, currentUserId, openAuthModal, showNotice } =
		useOutletContext<LayoutOutletContext>();
	const [totalCount, setTotalCount] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

	const handleSearch = (q: string) => {
		const params = new URLSearchParams({ q, type: "users" });
		navigate(`/search?${params.toString()}`);
	};

	const sortOptions = useSortOptions("users");
	const [sortValue, setSort] = useSortParam(sortOptions[0].value);

	const parsedTab = UsersTabSchema.safeParse(searchParams.get("tab"));
	const tab: UsersTab = parsedTab.success ? parsedTab.data : "all";

	const tabsConfig = useMemo((): { value: UsersTab; label: string }[] => {
		const all = [
			{ value: "all" as const, label: t("usersPage.tabAll") },
			{ value: "followers" as const, label: t("usersPage.tabFollowers") },
			{ value: "following" as const, label: t("usersPage.tabFollowing") },
		];
		// Hide auth-only tabs for guests; direct URL hits to ?tab=followers
		// still get the in-grid sign-in prompt.
		return isAuthenticated ? all : all.filter((entry) => entry.value === "all");
	}, [t, isAuthenticated]);

	const filterLabels = useMemo(
		() => tabsConfig.map((entry) => entry.label),
		[tabsConfig],
	);

	const activeLabel =
		tabsConfig.find((entry) => entry.value === tab)?.label ??
		tabsConfig[0].label;

	const handleTabChange = (label: string) => {
		const next = tabsConfig.find((entry) => entry.label === label);
		if (!next) {
			return;
		}
		setSearchParams(
			(prev) => {
				const params = new URLSearchParams(prev);
				if (next.value === "all") {
					params.delete("tab");
				} else {
					params.set("tab", next.value);
				}
				params.delete("page");
				return params;
			},
			{ replace: true },
		);
	};

	const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
	const page = getCurrentPage(searchParams, totalPages);

	return (
		<section className="users-page">
			<PageHeader
				title={t("usersPage.title")}
				totalLabel={`${t("usersPage.totalCount")} ${totalCount}`}
			/>

			<SearchField
				placeholder={t("common.searchPlaceholder")}
				onSubmit={handleSearch}
			/>

			<FilterList
				filters={filterLabels}
				activeFilter={activeLabel}
				onFilterChange={handleTabChange}
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
				isAuthenticated={isAuthenticated}
				currentUserId={currentUserId}
				openAuthModal={openAuthModal}
				showNotice={showNotice}
				tab={tab}
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
