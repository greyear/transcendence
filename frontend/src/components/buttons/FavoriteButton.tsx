import { Heart } from 'iconoir-react'
import { useState } from 'react'
import { IconButton } from './IconButton'
import "../../assets/styles/favoriteButton.css"


export const FavoriteButton = () => {
	const [active, setActive] = useState(false);
	const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		setActive((prev) => !prev)
	}
	return (
		<IconButton type="button" className={`favorite-button ${active ? 'active' : ''}`}
			onClick={(e) => handleClick(e)} ariaPressed={active}
			ariaLabel={active ? "Remove from favorites" : "Add to favorites"} >
			<Heart />
		</IconButton>
	)
}