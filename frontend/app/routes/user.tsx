import { NavArrowRight } from "iconoir-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import userPhoto from "~/assets/images/user-photo.jpg";
import "~/assets/styles/userProfile.css";
import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { RecipesGrid } from "~/components/RecipesGrid";
import { useScreenSize } from "~/composables/useScreenSize";

const UserPage = () => {
	const { t } = useTranslation();
	const { id } = useParams();
	const { screenSize } = useScreenSize();
	const [isFollowing, setIsFollowing] = useState(false);

	const recipesPerPage = screenSize === "mobile" ? 2 : 4;
	const username = id ? `User ${id}` : "Username";
	const isOnline = true;

	return (
		<section className="user-profile-page" aria-labelledby="user-profile-name">
			<header className="user-profile-header">
				<img
					className="user-profile-avatar"
					src={userPhoto}
					alt={`${username} profile`}
				/>
				<div className="user-profile-identity">
					<h1 id="user-profile-name">{username}</h1>
					<p
						className={`user-profile-status text-body3 ${isOnline ? "online" : "offline"
							}`}
					>
						{isOnline
							? t("userProfilePage.online")
							: t("userProfilePage.offline")}
					</p>
				</div>
				<MainButton
					onClick={() => setIsFollowing((prev) => !prev)}
					className={`user-profile-follow-button ${isFollowing ? "unfollow" : ""
						}`}
				>
					{isFollowing
						? t("userProfilePage.unfollow")
						: t("userProfilePage.follow")}
				</MainButton>
			</header>

			<section
				className="user-profile-recipes-section"
				aria-labelledby="authored-recipes-heading"
			>
				<div className="user-profile-recipe-header">
					<h2 id="authored-recipes-heading">
						{t("userProfilePage.authoredRecipes")}
					</h2>
					<TextIconButton
						to="/recipes"
						className="text-body2"
						aria-label={t("ariaLabels.allAuthoredRecipes")}
					>
						{t("userProfilePage.all")}
						<NavArrowRight aria-hidden="true" />
					</TextIconButton>
				</div>
				<RecipesGrid sortValue="" page={1} perPage={recipesPerPage} />
			</section>

			<section
				className="user-profile-recipes-section"
				aria-labelledby="favorite-recipes-heading"
			>
				<div className="user-profile-recipe-header">
					<h2 id="favorite-recipes-heading">
						{t("userProfilePage.favoriteRecipes")}
					</h2>
					<TextIconButton
						to="/recipes"
						className="text-body2"
						aria-label={t("ariaLabels.allFavoriteRecipes")}
					>
						{t("userProfilePage.all")}
						<NavArrowRight aria-hidden="true" />
					</TextIconButton>
				</div>
				<RecipesGrid sortValue="" page={1} perPage={recipesPerPage} />
			</section>
		</section>
	);
};

export default UserPage;
