import "../../assets/styles/searchField.css";
import { Search, Xmark } from "iconoir-react";
import { useRef } from "react";
import { IconButton } from "../buttons/IconButton";

type SearchProps = {
	value: string;
	onChange: (value: string) => void;
	onSearch?: () => void;
	placeholder?: string;
	className?: string;
	ariaLabel?: string;
};

export const SearchField = ({
	value,
	placeholder,
	className = "",
	ariaLabel = "Search",
	onChange,
	onSearch,
}: SearchProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSearch = () => {
		if (!value.trim()) return;
		onSearch?.();
		inputRef.current?.focus();
	};

	return (
		<div className={`search-wrapper ${className}`.trim()}>
			<IconButton
				className="magnifyer"
				type="button"
				aria-label="Search"
				onClick={handleSearch}
			>
				<Search />
			</IconButton>
			<input
				className="search-field text-body3"
				placeholder={placeholder}
				ref={inputRef}
				type="text"
				value={value}
				aria-label={ariaLabel}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						handleSearch();
					}
				}}
			/>
			{value && (
				<IconButton
					className="cross"
					type="button"
					aria-label="Clear search"
					onClick={() => {
						onChange("");
						inputRef.current?.focus();
					}}
				>
					<Xmark />
				</IconButton>
			)}
		</div>
	);
};
