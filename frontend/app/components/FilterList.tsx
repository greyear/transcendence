import { MainButton } from "~/components/buttons/MainButton";
import "~/assets/styles/filterList.css";

type FilterListProps = {
	filters: string[];
	activeFilter: string;
	onFilterChange: (filter: string) => void;
	ariaLabel?: string;
};

export const FilterList = ({
	filters,
	activeFilter,
	onFilterChange,
	ariaLabel,
}: FilterListProps) => {
	return (
		<div className="filter-list" role="group" aria-label={ariaLabel}>
			{filters.map((filter) => (
				<MainButton
					key={filter}
					variant="pill"
					active={activeFilter === filter}
					aria-pressed={activeFilter === filter}
					onClick={() => onFilterChange(filter)}
				>
					{filter}
				</MainButton>
			))}
		</div>
	);
};
