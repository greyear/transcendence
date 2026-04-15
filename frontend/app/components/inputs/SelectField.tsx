import Select from "react-select";
import "../../assets/styles/selectField.css";

type Option = {
	label: string;
	value: string;
};

type SelectFieldProps = {
	options: Option[];
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	inputId?: string;
	name?: string;
};

export const SelectField = ({
	options,
	placeholder = "",
	value,
	onChange,
	inputId,
	name,
}: SelectFieldProps) => {
	const selectedOption =
		value !== undefined
			? (options.find((o) => o.value === value) ?? null)
			: undefined;

	return (
		<div className="select-wrapper">
			<Select
				instanceId={inputId ?? "select"}
				inputId={inputId}
				name={name}
				options={options}
				placeholder={placeholder}
				value={selectedOption}
				onChange={(opt) => onChange?.(opt?.value ?? "")}
				classNamePrefix="react-select"
				isSearchable
				unstyled
			/>
		</div>
	);
};
