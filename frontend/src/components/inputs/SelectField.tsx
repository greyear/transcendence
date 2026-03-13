import type { SelectHTMLAttributes } from "react";
import "../../assets/styles/selectField.css";
import { NavArrowDown } from "iconoir-react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement>;

export const SelectField = ({
	className = "",
	children,
	...props
}: SelectFieldProps) => {
	return (
		<div className={`select-wrapper ${className}`.trim()}>
			<select className="select-field" {...props}>
				{children}
			</select>
			<NavArrowDown className="select-icon" />
		</div>
	);
};
