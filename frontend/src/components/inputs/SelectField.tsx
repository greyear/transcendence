import { NavArrowDown } from "iconoir-react";
import { useState } from "react";
import "../../assets/styles/selectField.css";

type Option = {
	label: string;
	value: string;
};

type SelectFieldProps = {
	options: Option[];
	placeholder?: string;
	onChange?: (value: string) => void;
};

export const SelectField = ({
	options,
	placeholder = "Search...",
	onChange,
}: SelectFieldProps) => {
	const [searchValue, setSearchValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const filteredOptions = options.filter((option) =>
		option.label.toLowerCase().includes(searchValue.toLowerCase()),
	);

	const openDropdown = () => {
		setIsOpen(true);
	};

	const toggleDropdown = () => {
		setIsOpen((prev) => !prev);
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(event.target.value);
		setIsOpen(true);
	};

	const handleSelect = (option: Option) => {
		setSearchValue(option.label);
		setIsOpen(false);
		onChange?.(option.value);
	};

	return (
		<div className="select-wrapper">
			<div className="select-field">
				<input
					className="select-input"
					value={searchValue}
					placeholder={placeholder}
					onFocus={openDropdown}
					onChange={handleInputChange}
				/>
				<button
					type="button"
					className="select-toggle"
					onClick={toggleDropdown}
					aria-label="Toggle options"
				>
					<NavArrowDown className={`select-icon ${isOpen ? "open" : ""}`} />
				</button>
			</div>

			{isOpen && (
				<ul className="select-dropdown">
					{filteredOptions.length > 0 ? (
						filteredOptions.map((option) => (
							<li key={option.value}>
								<button
									type="button"
									className="select-option"
									onClick={() => handleSelect(option)}
								>
									{option.label}
								</button>
							</li>
						))
					) : (
						<li>
							<div className="select-empty">No results found</div>
						</li>
					)}
				</ul>
			)}
		</div>
	);
};
