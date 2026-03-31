import { MainButton } from "~/components/buttons/MainButton";
import "~/assets/styles/filterList.css";

type FilterListProps = {
	filters: string[];
	activeFilter: string;
	onFilterChange: (filter: string) => void;
};

export const FilterList = ({
	filters,
	activeFilter,
	onFilterChange,
}: FilterListProps) => {
	return (
		<ul className="filter-list">
			{filters.map((filter) => (
				<li key={filter}>
					<MainButton
						variant="pill"
						active={activeFilter === filter}
						onClick={() => onFilterChange(filter)}
					>
						{filter}
					</MainButton>
				</li>
			))}
		</ul>
	);
};
