import { useTranslation } from "react-i18next";
import userPhoto from "../../assets/images/user-photo.jpg";
import "../../assets/styles/userCard.css";
import { Link } from "react-router";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import { MainButton } from "../buttons/MainButton";

type UserCardProps = {
	id: number;
	name: string;
	recipeCount: number;
	avatar?: string | null;
	isFollowing?: boolean;
	isFollowPending?: boolean;
	onFollowToggle?: (userId: number, shouldFollow: boolean) => void;
	showFollowButton?: boolean;
};

export const UserCard = ({
	id,
	name,
	recipeCount,
	avatar,
	isFollowing = false,
	isFollowPending = false,
	onFollowToggle,
	showFollowButton = true,
}: UserCardProps) => {
	const { t } = useTranslation();
	const avatarSrc = resolveMediaUrl(avatar) ?? userPhoto;

	const onFollowClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		if (isFollowPending) {
			return;
		}
		onFollowToggle?.(id, !isFollowing);
	};

	return (
		<Link to={`/user/${id}`} className="user-card-link-wrapper">
			<article className="user-card">
				<img
					className="user-card-photo"
					src={avatarSrc}
					alt={t("ariaLabels.profileAvatar", { name })}
				/>
				<div className="user-card-container">
					<header className="user-card-header">
						<h3>{name}</h3>
						<p className="text-body3">
							{recipeCount} {t("userCard.recipes")}
						</p>
					</header>
					{showFollowButton ? (
						<MainButton
							onClick={onFollowClick}
							aria-busy={isFollowPending}
							aria-label={t(
								isFollowing
									? "ariaLabels.unfollowUser"
									: "ariaLabels.followUser",
								{ name },
							)}
							className={`user-card-button ${isFollowing ? "unfollow" : ""}`}
						>
							{isFollowing ? t("userCard.unfollow") : t("userCard.follow")}
						</MainButton>
					) : null}
				</div>
			</article>
		</Link>
	);
};
