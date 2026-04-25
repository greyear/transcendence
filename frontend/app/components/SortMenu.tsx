import { Sort } from "iconoir-react";
import {
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import "~/assets/styles/sortMenu.css";
import "~/assets/styles/textIconButton.css";
import { useTranslation } from "react-i18next";

export type SortOption = {
	label: string;
	value: string;
};

type SortMenuProps = {
	options: SortOption[];
	value: string;
	onChange: (value: string) => void;
	label?: string;
	icon?: ReactNode;
	ariaLabel?: string;
};

export const SortMenu = ({
	options,
	value,
	onChange,
	label,
	icon,
	ariaLabel,
}: SortMenuProps) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const [activeIndex, setActiveIndex] = useState(0);
	const { t } = useTranslation();
	const listboxId = useId();

	useEffect(() => {
		if (!open) {
			return;
		}

		const currentIndex = options.findIndex((option) => option.value === value);
		const startIndex = currentIndex >= 0 ? currentIndex : 0;
		setActiveIndex(startIndex);
		requestAnimationFrame(() => {
			optionRefs.current[startIndex]?.focus();
		});
	}, [open, options, value]);

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

		const handleEscape = (e: globalThis.KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false);
				triggerRef.current?.focus();
			}
		};

		document.addEventListener("mousedown", handleOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	const focusOption = (index: number) => {
		setActiveIndex(index);
		optionRefs.current[index]?.focus();
	};

	const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (options.length === 0) {
			return;
		}

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				focusOption((activeIndex + 1) % options.length);
				break;
			case "ArrowUp":
				event.preventDefault();
				focusOption((activeIndex - 1 + options.length) % options.length);
				break;
			case "Home":
				event.preventDefault();
				focusOption(0);
				break;
			case "End":
				event.preventDefault();
				focusOption(options.length - 1);
				break;
			case "Tab":
				setOpen(false);
				break;
			default:
				break;
		}
	};

	const handleSelect = (next: string) => {
		onChange(next);
		setOpen(false);
		triggerRef.current?.focus();
	};

	return (
		<div className="sort-menu" ref={ref}>
			<button
				ref={triggerRef}
				type="button"
				className="text-button text-button--body1 primary"
				onClick={() => setOpen((prev) => !prev)}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listboxId}
			>
				{label ?? t("common.sortButton")}
				{icon ?? <Sort aria-hidden />}
			</button>

			{open && (
				<div
					id={listboxId}
					role="listbox"
					tabIndex={-1}
					className="sort-menu__dropdown"
					aria-label={ariaLabel ?? t("ariaLabels.sortBy")}
					onKeyDown={handleListKeyDown}
				>
					{options.map((option, index) => {
						const isSelected = option.value === value;
						return (
							<button
								key={option.value}
								type="button"
								role="option"
								aria-selected={isSelected}
								tabIndex={index === activeIndex ? 0 : -1}
								ref={(element) => {
									optionRefs.current[index] = element;
								}}
								className={`sort-menu__option${isSelected ? " sort-menu__option--active" : ""}`}
								onClick={() => handleSelect(option.value)}
								onFocus={() => setActiveIndex(index)}
							>
								{option.label}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};
