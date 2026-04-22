import Select, { type MultiValue } from "react-select";
import "../../assets/styles/selectField.css";

type Option = {
	label: string;
	value: string;
};

type MultiSelectFieldProps = {
	options: Option[];
	placeholder?: string;
	value: string[];
	onChange: (values: string[]) => void;
	inputId?: string;
	name?: string;
	className?: string;
	ariaLabel?: string;
};

export const MultiSelectField = ({
	options,
	placeholder = "",
	value,
	onChange,
	inputId,
	name,
	className,
	ariaLabel,
}: MultiSelectFieldProps) => {
	const selectedOptions = options.filter((option) =>
		value.includes(option.value),
	);

	return (
		<div className={`select-wrapper${className ? ` ${className}` : ""}`.trim()}>
			<Select
				isMulti
				instanceId={inputId ?? "multi-select"}
				inputId={inputId}
				name={name}
				options={options}
				placeholder={placeholder}
				value={selectedOptions}
				onChange={(newValue: MultiValue<Option>) =>
					onChange(newValue.map((option) => option.value))
				}
				classNamePrefix="react-select"
				aria-label={ariaLabel}
				isSearchable
				unstyled
				closeMenuOnSelect={false}
			/>
		</div>
	);
};
