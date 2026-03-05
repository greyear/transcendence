import { IconButton } from './IconButton'
import { CheckCircle, XmarkCircle } from 'iconoir-react'
import '../../assets/styles/moderationButton.css'

type ModerationAction = 'approve' | 'discard'

type Props = {
	action: ModerationAction
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export const ModerationButton = ({ action, onClick }: Props) => {
	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation()
		e.preventDefault()
		onClick?.(e)
	}

	const isApprove = action === 'approve'

	return (
		<IconButton
			className={`moderation-button ${isApprove ? 'approve' : 'discard'}`}
			onClick={(e) => handleClick(e)}
			ariaLabel={isApprove ? 'Approve' : 'Discard'}
		>
			{isApprove ? (
				<CheckCircle />
			) : (
				<XmarkCircle />
			)}
		</IconButton>
	)
}