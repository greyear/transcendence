import { Heart } from "iconoir-react";
import { useState } from "react";
import { IconButton } from "./IconButton";
import "../../assets/styles/favoriteButton.css";

type Props = {
	disabled?: boolean;
};

export const FavoriteButton = ({ disabled = false }: Props) => {
	const [isActive, setIsActive] = useState(false);
	const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		setIsActive((prev) => !prev);
	};
	return (
		<IconButton
			type="button"
			className={`favorite-button ${isActive ? "active" : ""}`}
			onClick={(e) => handleClick(e)}
			aria-pressed={isActive}
			aria-label={isActive ? "Remove from favorites" : "Add to favorites"}
			disabled={disabled}
		>
			<Heart />
		</IconButton>
	);
};
