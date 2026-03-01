import '../../styles/recipeCard.css'

export const RecipeCard = () => {
	return (
		<div className='recipe-card'>
			<img className='recipe-card-image'></img>
			<div className='recipe-card-container'>
				<div className='recipe-card-content-column'>
					<p className='text-label'>Title</p>
					<p className='text-caption-s'>Short description</p>
				</div>
			</div>
		</div>
	)
}