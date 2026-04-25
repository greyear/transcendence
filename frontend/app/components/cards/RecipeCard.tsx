import "../../assets/styles/recipeCard.scss";
import { StarSolid } from "iconoir-react";
import { Link } from "react-router";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import recipeImg from "../../assets/images/vegetable-side-dishes.jpg";
import { FavoriteButton } from "../buttons/FavoriteButton";

type RecipeCardProps = {
	id: number;
	title: string;
	description: string | null;
	rating: number | null;
	isFavorited: boolean;
	isFavoritePending?: boolean;
	onFavoriteClick: (recipeId: number) => void;
	pictureUrl?: string | null;
};

export const RecipeCard = ({
	id,
	title,
	description,
	rating,
	isFavorited,
	isFavoritePending,
	onFavoriteClick,
	pictureUrl,
}: RecipeCardProps) => {
	const imageSrc = resolveMediaUrl(pictureUrl) ?? recipeImg;

	return (
		<Link to={`/recipes/${id}`} className="recipe-card-link-wrapper">
			<article className="recipe-card">
				<img className="recipe-card-image" src={imageSrc} alt=""></img>
				<div className="recipe-card-container">
					<div className="recipe-card-content-column">
						<header className="recipe-card-header">
							<h3 className="text-label">{title}</h3>
							{description ? (
								<p className="text-caption-s">{description}</p>
							) : null}
						</header>
						<footer className="recipe-card-footer">
							{rating !== null ? (
								<div className="rating-row">
									<span className="text-caption">{rating.toFixed(1)}</span>
									<StarSolid aria-hidden="true" />
								</div>
							) : null}
							<FavoriteButton
								isFavorited={isFavorited}
								disabled={isFavoritePending}
								onClick={(event) => {
									event.preventDefault();
									event.stopPropagation();
									onFavoriteClick(id);
								}}
							/>
						</footer>
					</div>
				</div>
			</article>
		</Link>
	);
};
