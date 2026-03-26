import { useState } from "react";
import { MainButton } from "~/components/buttons/MainButton";
import { SearchField } from "~/components/inputs/SearchField";
import { UsersGrid } from "~/components/UsersGrid";
import "~/assets/styles/people.css";
import { Filter, Sort } from "iconoir-react";
import { TextIconButton } from "~/components/buttons/TextIconButton";

const PeoplePage = () => {
	const filters = ["All", "Followers", "Following"];
	const [activeFilter, setActiveFilter] = useState("All");

	return (
		<section className="people-page">
			<header className="people-page-header">
				<h2 className="people-page-title">People</h2>
				<p className="people-page-total text-label">Total people: 37</p>
			</header>

			<div className="people-page-search">
				<SearchField />
			</div>

			<div className="people-page-filters">
				<ul className="filter-list">
					{filters.map((filter) => (
						<li key={filter} className="filter-list-item">
							<MainButton
								variant="pill"
								active={activeFilter === filter}
								onClick={() => setActiveFilter(filter)}
							>
								{filter}
							</MainButton>
						</li>
					))}
				</ul>
			</div>

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

			<div className="people-page-grid">
				<UsersGrid />
			</div>
		</section>
	);
};

export default PeoplePage;
