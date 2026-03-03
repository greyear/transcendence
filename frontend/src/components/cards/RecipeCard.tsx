import '../../assets/styles/recipeCard.css'
import recipeImg from '../../assets/images/vegetable-side-dishes.jpg'
import { FavoriteButton } from '../buttons/FavoriteButton'

export const RecipeCard = () => {
	return (
		<a href='/recipe-page' className='recipe-card-link-wrapper'>
			<article className='recipe-card'>
				<img className='recipe-card-image' src={recipeImg} alt='Vegetable side dishes'></img>
				<div className='recipe-card-container'>
					<div className='recipe-card-content-column'>
						<header className='recipe-card-header'>
							<h3 className='text-label'>Title</h3>
							<p className='text-caption-s'>Short description</p>
						</header>
						<footer className='recipe-card-footer'>
							<span className='text-caption'>smth</span>
							<FavoriteButton />
						</footer>
					</div>
				</div>
			</article>
		</a>
	)
}