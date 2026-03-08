import { useState } from 'react'
import userPhoto from '../../assets/images/user-photo.jpg'
import '../../assets/styles/userCard.css'
import { MainButton } from '../buttons/MainButton'

export const UserCard = () => {
	const [isActive, setIsActive] = useState(false)
	const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		//TODO: add confirmation unfollow popup.
		setIsActive((prev) => !prev);
	}
	return (
		<a href='/user' className='user-card-link-wrapper'>
			<article className='user-card'>
				<img className='user-card-photo' src={userPhoto} alt='User profile photo' />
				<div className='user-card-container'>
					<header className='user-card-header'>
						<h3>Name</h3>
						<p className='text-body3'>123 recipes</p>
					</header>
					<MainButton onClick={onClick} className={isActive ? "unfollow-button" : ""}>
						{isActive ? "Unfollow" : "Follow"}
					</MainButton>
				</div>
			</article >
		</a>
	)
}