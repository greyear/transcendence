import { useState } from "react";
import {
	type MetaFunction,
	useNavigate,
	useOutletContext,
	useSearchParams,
} from "react-router";
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
import { useDocumentTitle } from "~/composables/useDocumentTitle";
import {
	PER_PAGE_OPTIONS,
	usePerPageParam,
} from "~/composables/usePerPageParam";
import { useSortOptions } from "~/composables/useSortOptions";
import { useSortParam } from "~/composables/useSortParam";
import type { LayoutOutletContext } from "~/layouts/layout";

export const meta: MetaFunction = () => [{ title: "Users — Transcendence" }];

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
	useDocumentTitle(t("pageTitles.users"));
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
	const requestedTab: UsersTab = parsedTab.success ? parsedTab.data : "all";
	// Guests hitting ?tab=followers via a bookmark shouldn't see FilterList
	// highlight "All" while the grid renders a sign-in gate for "followers" —
	// collapse both to "all" so the UI stays coherent.
	const tab: UsersTab =
		!isAuthenticated && AUTH_REQUIRED_TABS.has(requestedTab)
			? "all"
			: requestedTab;

	// Inline: the tab bar is only rendered for authenticated users, so
	// skipping these allocations for guests is cheap and keeps the hook list
	// above small. All three of `tabsConfig`, the label list, and the
	// onFilterChange handler live inside `renderTabBar` because none of them
	// are used anywhere else.
	const renderTabBar = () => {
		const tabsConfig = UsersTabSchema.options.map((value) => ({
			value,
			label: t(TAB_LABEL_KEYS[value]),
		}));
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
		return (
			<FilterList
				filters={tabsConfig.map((entry) => entry.label)}
				activeFilter={t(TAB_LABEL_KEYS[tab])}
				onFilterChange={handleTabChange}
			/>
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

			{isAuthenticated ? renderTabBar() : null}

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
