import "../../assets/styles/mainButton.css"

type Props = {
	children: React.ReactNode
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
	disabled?: boolean
	type?: "button" | "submit" | "reset"
	variant?: "primary"
}

export const MainButton = ({
	children,
	onClick,
	disabled,
	type = "button",
	variant = "primary"
}: Props) => {
	return (
		<button
			type={type}
			className={`main-button ${variant}`}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	)
}