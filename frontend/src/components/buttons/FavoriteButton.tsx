import { Heart } from 'iconoir-react'
import { useState } from 'react'
import "../../assets/styles/favoriteButton.css"


export const FavoriteButton = () => {
	const [isActive, setIsActive] = useState(false);
	function handleClick() {
		setIsActive(!isActive);
	}
	return (
		<button type="button" className="favorite-button" 
			onClick={handleClick} aria-pressed={isActive} 
			aria-label={isActive ? "Remove from favorites" : "Add to favorites"}>
			<Heart className={`favorite-icon ${isActive ? 'is-active' : ''}`} />
		</button>
	)
}