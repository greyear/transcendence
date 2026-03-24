import { useState } from "react";
import userPhoto from "../../assets/images/user-photo.jpg";
import "../../assets/styles/userCard.css";
import { Link } from "react-router";
import { MainButton } from "../buttons/MainButton";

type UserCardProps = {
	id: number;
	name: string;
	recipeCount: number;
};

export const UserCard = ({ id, name, recipeCount }: UserCardProps) => {
	const [isActive, setIsActive] = useState(false);
	const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		//TODO: add confirmation unfollow popup.
		setIsActive((prev) => !prev);
	};
	return (
		<Link to={`/user/${id}`} className="user-card-link-wrapper">
			<article className="user-card">
				<img className="user-card-photo" src={userPhoto} alt="User profile" />
				<div className="user-card-container">
					<header className="user-card-header">
						<h3>{name}</h3>
						<p className="text-body3">{recipeCount} recipes</p>
					</header>
					<MainButton
						onClick={onClick}
						className={`user-card-button ${isActive ? "unfollow" : ""}`}
					>
						{isActive ? "Unfollow" : "Follow"}
					</MainButton>
				</div>
			</article>
		</Link>
	);
};
