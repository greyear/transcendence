import type { AnchorHTMLAttributes, ReactNode } from "react";
import "../../assets/styles/textLink.css";

interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	children: ReactNode;
}

//TODO: replace it by Link when router is set up

export const TextLink = ({
	children,
	className = "",
	...props
}: TextLinkProps) => {
	return (
		<a className={`text-link ${className}`.trim()} {...props}>
			{children}
		</a>
	);
};