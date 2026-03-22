import { Link } from "react-router";

export type PaginationItemVariant = "page" | "nav";

type PaginationItemProps = {
	children: React.ReactNode;
	to: string;
	ariaLabel: string;
	variant?: PaginationItemVariant;
	active?: boolean;
	disabled?: boolean;
	hideMobile?: boolean;
	ariaCurrentPage?: boolean;
};

export const PaginationItem = ({
	to,
	ariaLabel,
	variant = "page",
	active = false,
	disabled = false,
	hideMobile = false,
	ariaCurrentPage = false,
	children,
}: PaginationItemProps) => {
	const className = [
		"pagination-item",
		"text-label",
		`pagination-item--${variant}`,
		active && "active",
		disabled && "disabled",
		hideMobile && "hide-mobile",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<Link
			to={to}
			className={className}
			aria-label={ariaLabel}
			aria-current={ariaCurrentPage ? "page" : undefined}
		>
			{children}
		</Link>
	);
};
