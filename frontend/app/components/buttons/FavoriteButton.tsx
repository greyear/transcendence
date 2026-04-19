import { Heart } from "iconoir-react";
import type { MouseEvent } from "react";
import { IconButton } from "./IconButton";
import "../../assets/styles/favoriteButton.css";
import { useTranslation } from "react-i18next";

type FavoriteButtonProps = {
	disabled?: boolean;
	isFavorited: boolean;
	onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

export const FavoriteButton = ({
	disabled = false,
	isFavorited,
	onClick,
}: FavoriteButtonProps) => {
	const { t } = useTranslation();

	return (
		<IconButton
			type="button"
			className={`favorite-button ${isFavorited ? "active" : ""}`}
			onClick={onClick}
			aria-pressed={isFavorited}
			aria-label={
				isFavorited
					? t("ariaLabels.removeFromFavorites")
					: t("ariaLabels.addToFavorites")
			}
			disabled={disabled}
		>
			<Heart />
		</IconButton>
	);
};
