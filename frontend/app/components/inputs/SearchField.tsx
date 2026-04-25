import "../../assets/styles/searchField.css";
import { ArrowLeft, Search, Xmark } from "iconoir-react";
import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../buttons/IconButton";

type SearchProps = {
	placeholder?: string;
	className?: string;
	ariaLabel?: string;
	mode?: "always-open" | "collapsible";
	defaultValue?: string;
	onSubmit?: (query: string) => void;
	onClear?: () => void;
};

export const SearchField = ({
	placeholder = "Search for ...",
	className = "",
	ariaLabel,
	mode = "always-open",
	defaultValue = "",
	onSubmit: onSubmitProp,
	onClear,
}: SearchProps) => {
	const { t } = useTranslation();
	const id = useId();
	const [value, setValue] = useState(defaultValue);
	const [isOpen, setIsOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const translatedAriaLabel = ariaLabel ?? t("ariaLabels.search");

	const showSearch = mode === "always-open" || isOpen;

	const openSearch = () => {
		setIsOpen(true);
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const closeSearch = () => {
		setIsOpen(false);
		setValue("");
	};

	const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		const query = value.trim();
		if (!query) {
			return;
		}
		onSubmitProp?.(query);
	};

	if (!showSearch) {
		return (
			<IconButton
				className={`magnifier-toggle ${className}`.trim()}
				type="button"
				aria-label={t("ariaLabels.openSearch")}
				onClick={openSearch}
			>
				<Search />
			</IconButton>
		);
	}

	return (
		<search className={className}>
			<form id={id} className="search-wrapper" onSubmit={handleSubmit}>
				{mode === "collapsible" ? (
					<IconButton
						className="search-inline-button"
						type="button"
						aria-label={t("ariaLabels.closeSearch")}
						onClick={closeSearch}
					>
						<ArrowLeft />
					</IconButton>
				) : (
					<IconButton
						className="search-inline-button"
						type="submit"
						aria-label={t("ariaLabels.search")}
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
					aria-label={translatedAriaLabel}
					onChange={(e) => setValue(e.target.value)}
					onBlur={() => {
						// If the user emptied a previously-populated field and tabbed
						// away, treat that as a clear so the parent can drop `?q=`
						// without forcing the user to also click the X.
						if (value === "" && defaultValue !== "") {
							onClear?.();
						}
					}}
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
						aria-label={t("ariaLabels.clearSearch")}
						onClick={() => {
							setValue("");
							inputRef.current?.focus();
							onClear?.();
						}}
					>
						<Xmark />
					</IconButton>
				)}
			</form>
		</search>
	);
};
