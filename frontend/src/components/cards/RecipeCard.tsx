import '../../assets/styles/recipeCard.css'
import recipeImg from '../../assets/images/vegetable-side-dishes.jpg'

export const RecipeCard = () => {
	return (
		<article className='recipe-card'>
			<img className='recipe-card-image' src={recipeImg} alt='Vegetable side dishes'></img>
			<div className='recipe-card-container'>
				<div className='recipe-card-content-column'>
					<header className='recipe-card-title-description-column'>
						<h3 className='text-label'>Title</h3>
						<p className='text-caption-s'>Short description</p>
					</header>
					<footer className='recipe-card-tag-favorite-row'>
						<span className='text-caption'>smth</span>
						<button aria-label='Add to favorites'>heart</button>
					</footer>
				</div>
			</div>
		</article>
	)
}