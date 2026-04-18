import { type ReactNode, useState } from "react";
import "../../assets/styles/textArea.css";

type TextAreaProps = {
	id: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	required?: boolean;
	maxLength?: number;
	rows?: number;
	className?: string;
	wrapperClassName?: string;
	"aria-label"?: string;
	describedBy?: string;
	footer?: ReactNode;
};

export const TextArea = ({
	id,
	value,
	onChange,
	placeholder,
	required,
	maxLength,
	rows,
	className,
	wrapperClassName,
	"aria-label": ariaLabel,
	describedBy,
	footer,
}: TextAreaProps) => {
	const [error, setError] = useState("");
	const errorId = `${id}-error`;
	const describedByIds =
		[error ? errorId : null, describedBy].filter(Boolean).join(" ") ||
		undefined;
	const hasFooter = Boolean(error || footer);

	return (
		<div
			className={`text-area-wrapper${wrapperClassName ? ` ${wrapperClassName}` : ""}`}
		>
			<textarea
				id={id}
				className={`text-area${error ? " error" : ""}${className ? ` ${className}` : ""}`}
				value={value}
				placeholder={placeholder}
				required={required}
				maxLength={maxLength}
				rows={rows}
				aria-label={ariaLabel}
				aria-invalid={error ? "true" : "false"}
				aria-describedby={describedByIds}
				onChange={(e) => {
					onChange(e.target.value);
					setError("");
				}}
				onBlur={(e) => {
					if (!e.currentTarget.checkValidity()) {
						setError(
							e.currentTarget.validity.valueMissing
								? "This field is required."
								: e.currentTarget.validationMessage,
						);
					}
				}}
			/>
			{hasFooter ? (
				<div className="text-area-footer">
					{error ? (
						<p
							id={errorId}
							className="error-message text-caption-s"
							role="alert"
						>
							{error}
						</p>
					) : null}
					{footer}
				</div>
			) : null}
		</div>
	);
};
