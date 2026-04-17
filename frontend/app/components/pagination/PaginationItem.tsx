import { Link } from "react-router";

export type PaginationItemVariant = "page" | "nav";

type PaginationItemProps = {
	children: React.ReactNode;
	to: string;
	ariaLabel: string;
	variant?: PaginationItemVariant;
	active?: boolean;
	disabled?: boolean;
	ariaCurrentPage?: boolean;
};

export const PaginationItem = ({
	to,
	ariaLabel,
	variant = "page",
	active = false,
	disabled = false,
	ariaCurrentPage = false,
	children,
}: PaginationItemProps) => {
	const className = [
		"pagination__link",
		`pagination__link--${variant}`,
		active && "pagination__link--active",
		disabled && "pagination__link--disabled",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<Link
			to={to}
			className={className}
			aria-label={ariaLabel}
			aria-current={ariaCurrentPage ? "page" : undefined}
			aria-disabled={disabled || undefined}
			tabIndex={disabled ? -1 : undefined}
			onClick={(event) => {
				if (disabled) {
					event.preventDefault();
				}
			}}
		>
			{children}
		</Link>
	);
};
