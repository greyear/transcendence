import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import "../../assets/styles/iconButton.css";
import { Link } from "react-router";

type IconButtonVariants = "default" | "transparent" | "language";

type BaseProps = {
	children: ReactNode;
	variant?: IconButtonVariants;
	className?: string;
};

type ButtonIconButtonProps = BaseProps &
	Omit<ComponentPropsWithoutRef<"button">, keyof BaseProps> & {
		to?: never;
		ref?: Ref<HTMLButtonElement>;
		"data-initial-focus"?: boolean;
	};

type LinkIconButtonProps = BaseProps &
	Omit<
		ComponentPropsWithoutRef<typeof Link>,
		keyof BaseProps | "to" | "aria-pressed"
	> & {
		to: string;
		ref?: Ref<HTMLAnchorElement>;
	};

type IconButtonProps = ButtonIconButtonProps | LinkIconButtonProps;

export const IconButton = (props: IconButtonProps) => {
	const { children, className = "", variant = "default" } = props;
	const combinedClasses = `icon-button ${variant} ${className}`.trim();

	if (props.to !== undefined) {
		const {
			to,
			variant: _v,
			className: _c,
			children: _ch,
			...linkProps
		} = props;
		return (
			<Link to={to} className={combinedClasses} {...linkProps}>
				{children}
			</Link>
		);
	}

	const {
		to: _to,
		"data-initial-focus": dataInitialFocus,
		type = "button",
		variant: _v,
		className: _c,
		children: _ch,
		...buttonRest
	} = props;
	return (
		<button
			type={type}
			className={combinedClasses}
			data-initial-focus={dataInitialFocus}
			{...buttonRest}
		>
			{children}
		</button>
	);
};
