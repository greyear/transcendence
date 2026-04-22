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
import {
	PER_PAGE_OPTIONS,
	usePerPageParam,
} from "~/composables/usePerPageParam";
import { useSortOptions } from "~/composables/useSortOptions";
import { useSortParam } from "~/composables/useSortParam";
import type { LayoutOutletContext } from "~/layouts/layout";

const PER_PAGE_MENU_OPTIONS = PER_PAGE_OPTIONS.map((n) => ({
	label: String(n),
	value: String(n),
}));

const TAB_LABEL_KEYS: Record<UsersTab, string> = {
	all: "usersPage.tabAll",
	followers: "usersPage.tabFollowers",
	following: "usersPage.tabFollowing",
};

const AUTH_REQUIRED_TABS: ReadonlySet<UsersTab> = new Set([
	"followers",
	"following",
]);

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
	const [perPage, setPerPage] = usePerPageParam();

	const parsedTab = UsersTabSchema.safeParse(searchParams.get("tab"));
	const tab: UsersTab = parsedTab.success ? parsedTab.data : "all";

	// Hide auth-only tabs for guests; direct URL hits to ?tab=followers
	// still get the in-grid sign-in prompt.
	const tabsConfig = useMemo(
		() =>
			UsersTabSchema.options
				.filter((value) => isAuthenticated || !AUTH_REQUIRED_TABS.has(value))
				.map((value) => ({ value, label: t(TAB_LABEL_KEYS[value]) })),
		[t, isAuthenticated],
	);

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

	const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
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
				perPage={perPage}
				sortValue={sortValue}
				onLoad={setTotalCount}
				isAuthenticated={isAuthenticated}
				currentUserId={currentUserId}
				openAuthModal={openAuthModal}
				showNotice={showNotice}
				tab={tab}
			/>

			<div className="pagination-row">
				<SortMenu
					options={PER_PAGE_MENU_OPTIONS}
					value={String(perPage)}
					onChange={(value) => setPerPage(Number(value))}
					label={`${t("common.perPage")}: ${perPage}`}
				/>
				<Pagination
					totalElementsCount={totalCount}
					elementsPerPage={perPage}
					totalPagesCount={totalPages}
				/>
			</div>
		</section>
	);
};

export default UsersPage;
