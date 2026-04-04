import { MainButton } from "~/components/buttons/MainButton";
import "~/assets/styles/filterList.css";

type FilterListProps = {
	filters: string[];
	activeIndex: number;
	onFilterChange: (index: number) => void;
};

export const FilterList = ({
	filters,
	activeIndex,
	onFilterChange,
}: FilterListProps) => {
	return (
		<ul className="filter-list">
			{filters.map((filter, index) => (
				<li key={filter}>
					<MainButton
						variant="pill"
						active={activeIndex === index}
						onClick={() => onFilterChange(index)}
					>
						{filter}
					</MainButton>
				</li>
			))}
		</ul>
	);
};
