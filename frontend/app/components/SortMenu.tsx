import { Sort } from "iconoir-react";
import { useEffect, useRef, useState } from "react";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import "~/assets/styles/sortMenu.css";
import { useTranslation } from "react-i18next";

export type SortOption = {
	label: string;
	value: string;
};

type SortMenuProps = {
	options: SortOption[];
	value: string;
	onChange: (value: string) => void;
};

export const SortMenu = ({ options, value, onChange }: SortMenuProps) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const { t } = useTranslation();

	useEffect(() => {
		if (!open) {
			return;
		}

		const handleOutside = (e: MouseEvent) => {
			if (!ref.current) {
				return;
			}

			if (e.target instanceof Node && !ref.current.contains(e.target)) {
				setOpen(false);
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	return (
		<div className="sort-menu" ref={ref}>
			<TextIconButton onClick={() => setOpen((prev) => !prev)}>
				{t("recipesPage.sortButton")}
				<Sort />
			</TextIconButton>

			{open && (
				<ul className="sort-menu__dropdown" aria-label="Sort by">
					{options.map((option) => (
						<li key={option.value}>
							<button
								type="button"
								className={`sort-menu__option${option.value === value ? " sort-menu__option--active" : ""}`}
								onClick={() => {
									onChange(option.value);
									setOpen(false);
								}}
							>
								{option.label}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
