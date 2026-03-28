import { useState } from "react";
import { MainButton } from "~/components/buttons/MainButton";
import { SearchField } from "~/components/inputs/SearchField";
import { UsersGrid } from "~/components/UsersGrid";
import "~/assets/styles/people.css";
import { Filter, Sort } from "iconoir-react";
import { TextIconButton } from "~/components/buttons/TextIconButton";

const filters = ["All", "Followers", "Following"];

const PeoplePage = () => {
	const [activeFilter, setActiveFilter] = useState("All");

	return (
		<section className="people-page">
			<header className="people-page-header">
				<h1 className="h2 people-page-title">People</h1>
				<p className="people-page-total text-label">Total people: 37</p>
			</header>

			<SearchField />

			<ul className="filter-list" role="tablist">
				{filters.map((filter) => (
					<li key={filter}>
						<MainButton
							variant="pill"
							active={activeFilter === filter}
							onClick={() => setActiveFilter(filter)}
							role="tab"
							aria-selected={activeFilter === filter}
						>
							{filter}
						</MainButton>
					</li>
				))}
			</ul>

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
