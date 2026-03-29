import { useState } from "react";
import { useSearchParams } from "react-router";
import { MainButton } from "~/components/buttons/MainButton";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import { RecipesGrid } from "~/components/RecipesGrid";
import "~/assets/styles/recipes.css";
import { Filter, Sort } from "iconoir-react";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { getCurrentPage } from "~/composables/getCurrentPage";

const filters = ["All", "My Recipes", "Favorites"];
const PER_PAGE = 12;

const RecipesPage = () => {
	const [activeFilter, setActiveFilter] = useState("All");
	const [totalCount, setTotalCount] = useState(0);
	const [searchParams] = useSearchParams();

	const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
	const page = getCurrentPage(searchParams, totalPages);

	return (
		<section className="recipes-page">
			<PageHeader
				title="Recipes"
				totalLabel={`Total recipes: ${totalCount}`}
				action={<MainButton>+ Create new</MainButton>}
			/>

			<SearchField />

			<FilterList
				filters={filters}
				activeFilter={activeFilter}
				onFilterChange={setActiveFilter}
			/>

			<div className="recipes-page-controls">
				<TextIconButton>
					Sort
					<Sort />
				</TextIconButton>

				<TextIconButton>
					Filter
					<Filter />
				</TextIconButton>
			</div>

			<RecipesGrid page={page} perPage={PER_PAGE} onLoad={setTotalCount} />

			<Pagination
				totalElementsCount={totalCount}
				elementsPerPage={PER_PAGE}
				totalPagesCount={totalPages}
			/>
		</section>
	);
};

export default RecipesPage;
