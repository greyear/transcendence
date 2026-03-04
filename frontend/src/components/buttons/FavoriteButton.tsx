import { Heart } from "iconoir-react";
import { useState } from "react";
import "../../assets/styles/favoriteButton.css";

export const FavoriteButton = () => {
	const [isActive, setIsActive] = useState(false);
	const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		setIsActive(!isActive);
	};
	return (
		<button
			type="button"
			className="favorite-button"
			onClick={(e) => handleClick(e)}
			aria-pressed={isActive}
			aria-label={isActive ? "Remove from favorites" : "Add to favorites"}
		>
			<Heart className={`favorite-icon ${isActive ? "is-active" : ""}`} />
		</button>
	);
};
