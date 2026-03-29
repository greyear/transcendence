import { Sort } from "iconoir-react";
import { useEffect, useRef, useState } from "react";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import "~/assets/styles/sortMenu.css";

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

	useEffect(() => {
		if (!open) return;

		const handleOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
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
				Sort
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
