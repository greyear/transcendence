import { useState } from "react";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { UsersGrid } from "~/components/UsersGrid";
import "~/assets/styles/people.css";
import { Filter, Sort } from "iconoir-react";
import { TextIconButton } from "~/components/buttons/TextIconButton";

const filters = ["All", "Followers", "Following"];

const PeoplePage = () => {
	const [activeFilter, setActiveFilter] = useState("All");

	return (
		<section className="people-page">
			<PageHeader title="People" totalLabel="Total people: 37" />

			<SearchField />

			<FilterList
				filters={filters}
				activeFilter={activeFilter}
				onFilterChange={setActiveFilter}
			/>

			<div className="people-page-controls">
				<TextIconButton>
					Sort
					<Sort />
				</TextIconButton>

				<TextIconButton>
					Filter
					<Filter />
				</TextIconButton>
			</div>

			<UsersGrid />
		</section>
	);
};

export default PeoplePage;
