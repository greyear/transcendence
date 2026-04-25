import { MainButton } from "~/components/buttons/MainButton";
import "~/assets/styles/filterList.scss";

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
		<fieldset className="filter-list" aria-label={ariaLabel}>
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
		</fieldset>
	);
};
