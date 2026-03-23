import "../../assets/styles/recipeCard.css";
import { StarSolid } from "iconoir-react";
import { Link } from "react-router";
import recipeImg from "../../assets/images/vegetable-side-dishes.jpg";
import { FavoriteButton } from "../buttons/FavoriteButton";

type RecipeCardProps = {
	id: number;
	title: string;
	description: string;
	rating: string;
};

export const RecipeCard = ({
	id,
	title,
	description,
	rating,
}: RecipeCardProps) => {
	return (
		<Link to={`/recipe/${id}`} className="recipe-card-link-wrapper">
			<article className="recipe-card">
				<img
					className="recipe-card-image"
					src={recipeImg}
					alt="Vegetable side dishes"
				></img>
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
