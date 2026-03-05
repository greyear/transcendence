import '../../assets/styles/iconButton.css'

type IconButtonProps = {
	children: React.ReactNode
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
	className?: string
	type?: 'button' | 'submit' | 'reset'
	ariaLabel?: string
	ariaPressed?: boolean
}

export const IconButton = ({
	children,
	onClick,
	className = '',
	type = 'button',
	ariaLabel,
	ariaPressed,
}: IconButtonProps) => {
	return (
		<button
			type={type}
			className={`icon-button ${className}`.trim()}
			onClick={onClick}
			aria-label={ariaLabel}
			aria-pressed={ariaPressed}
		>
			{children}
		</button>
	)
}