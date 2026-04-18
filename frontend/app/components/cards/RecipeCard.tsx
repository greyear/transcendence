import "../../assets/styles/recipeCard.css";
import { StarSolid } from "iconoir-react";
import { Link } from "react-router";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import recipeImg from "../../assets/images/vegetable-side-dishes.jpg";
import { FavoriteButton } from "../buttons/FavoriteButton";

type RecipeCardProps = {
	id: number;
	title: string;
	description: string;
	rating: string;
	pictureUrl?: string | null;
};

export const RecipeCard = ({
	id,
	title,
	description,
	rating,
	pictureUrl,
}: RecipeCardProps) => {
	const imageSrc = resolveMediaUrl(pictureUrl) ?? recipeImg;

	return (
		<Link to={`/recipes/${id}`} className="recipe-card-link-wrapper">
			<article className="recipe-card">
				<img className="recipe-card-image" src={imageSrc} alt={title}></img>
				<div className="recipe-card-container">
					<div className="recipe-card-content-column">
						<header className="recipe-card-header">
							<h3 className="text-label">{title}</h3>
							<p className="text-caption-s">{description}</p>
						</header>
						<footer className="recipe-card-footer">
							<div className="rating-row">
								<span className="text-caption">{rating}</span>
								<StarSolid />
							</div>
							<FavoriteButton />
						</footer>
					</div>
				</div>
			</article>
		</Link>
	);
};
