import userPhoto from '../../assets/images/user-photo.jpg'
import '../../assets/styles/userCard.css'

export const UserCard = () => {
	return (
		<a href='/user' className='user-card-link-wrapper'>
			<article className='user-card'>
				<img className='user-card-photo' src={userPhoto} alt='User profile photo' />
				<div className='user-card-container'>
					<header className='user-card-header'>
						<h3>Name</h3>
						<p className='text-body3'>123 recipes</p>
					</header>
					<button>Follow</button>
				</div>
			</article>
		</a>
	)
}