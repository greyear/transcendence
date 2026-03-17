import Select from "react-select";
import "../../assets/styles/selectField.css";

type Option = {
	label: string;
	value: string;
};

type SelectFieldProps = {
	options: Option[];
	placeholder?: string;
	onChange?: (value: string) => void;
	inputId?: string;
	name?: string;
};

export const SelectField = ({
	options,
	placeholder = "",
	onChange,
	inputId,
	name,
}: SelectFieldProps) => {
	return (
		<div className="select-wrapper">
			<Select
				inputId={inputId}
				name={name}
				options={options}
				placeholder={placeholder}
				onChange={(selectedOption) => onChange?.(selectedOption?.value ?? "")}
				classNamePrefix="react-select"
				isSearchable
			/>
		</div>
	);
};
