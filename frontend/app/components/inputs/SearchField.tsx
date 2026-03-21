import "../../assets/styles/searchField.css";
import { ArrowLeft, Search, Xmark } from "iconoir-react";
import { useRef, useState } from "react";
import { IconButton } from "../buttons/IconButton";

type SearchProps = {
	placeholder?: string;
	className?: string;
	ariaLabel?: string;
	mode?: "always-open" | "collapsible";
};

export const SearchField = ({
	placeholder,
	className = "",
	ariaLabel = "Search",
	mode = "always-open",
}: SearchProps) => {
	const [value, setValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const showSearch = mode === "always-open" || isOpen;

	const openSearch = () => {
		setIsOpen(true);
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const closeSearch = () => {
		setIsOpen(false);
		setValue("");
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const query = value.trim();
		if (!query) return;

		// later navigation/search logic comes here
	};

	if (!showSearch) {
		return (
			<IconButton
				className={`magnifier-toggle ${className}`.trim()}
				type="button"
				aria-label="Open search"
				onClick={openSearch}
			>
				<Search />
			</IconButton>
		);
	}

	return (
		<form
			role="search"
			className={`search-wrapper ${className}`.trim()}
			onSubmit={handleSubmit}
		>
			{mode === "collapsible" ? (
				<IconButton
					className="search-inline-button"
					type="button"
					aria-label="Close search"
					onClick={closeSearch}
				>
					<ArrowLeft />
				</IconButton>
			) : (
				<IconButton
					className="search-inline-button"
					type="submit"
					aria-label="Search"
				>
					<Search />
				</IconButton>
			)}

			<input
				ref={inputRef}
				className="search-field text-body3"
				type="text"
				value={value}
				placeholder={placeholder}
				aria-label={ariaLabel}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						if (mode === "collapsible") {
							closeSearch();
						} else {
							inputRef.current?.blur();
						}
					}
				}}
			/>

			{value && (
				<IconButton
					className="cross"
					type="button"
					aria-label="Clear search"
					onClick={() => {
						setValue("");
						inputRef.current?.focus();
					}}
				>
					<Xmark />
				</IconButton>
			)}
		</form>
	);
};
