import { useState } from "react";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();
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
						<p className="text-body3">{recipeCount} {t("userCard.recipes")}</p>
					</header>
					<MainButton
						onClick={onClick}
						className={`user-card-button ${isActive ? "unfollow" : ""}`}
					>
						{isActive ? t("userCard.unfollow") : t("userCard.follow")}
					</MainButton>
				</div>
			</article>
		</Link>
	);
};
