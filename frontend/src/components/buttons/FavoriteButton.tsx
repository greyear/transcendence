import { Heart } from 'iconoir-react'
import { useState } from 'react'
import "../../assets/styles/favoriteButton.css"


const FavoriteButton = () => {
	const [isActive, setIsActive] = useState(false);
	function handleClick() {
		setIsActive(!isActive);
	}
	return (
		<button type="button" className="favoriteButton" onClick={handleClick}>
			<Heart className={isActive ? "favoriteHeartActive" : "favoriteHeartInactive"} />
		</button>
	)
}

export default FavoriteButton