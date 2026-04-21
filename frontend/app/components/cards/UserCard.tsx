import { useTranslation } from "react-i18next";
import userPhoto from "../../assets/images/user-photo.jpg";
import "../../assets/styles/userCard.css";
import { Link, useNavigate } from "react-router";
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
	/**
	 * Pass `true` when this card represents the logged-in user's own account.
	 * The Follow/Unfollow button is replaced with a "Profile" shortcut so the
	 * own card isn't visually empty where the follow button would otherwise be.
	 */
	isOwnCard?: boolean;
};

export const UserCard = ({
	id,
	name,
	recipeCount,
	avatar,
	isFollowing = false,
	isFollowPending = false,
	onFollowToggle,
	isOwnCard = false,
}: UserCardProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const avatarSrc = resolveMediaUrl(avatar) ?? userPhoto;

	const onFollowClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		if (isFollowPending) {
			return;
		}
		onFollowToggle?.(id, !isFollowing);
	};

	// The whole card is wrapped in a <Link>, so we can't render another <Link>
	// here (nested <a> is invalid). Navigate imperatively and cancel the outer
	// link's default navigation to avoid a double-nav to `/user/:ownId`.
	const onProfileClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		navigate("/profile");
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
					{isOwnCard ? (
						<MainButton
							onClick={onProfileClick}
							variant="inverted"
							aria-label={t("ariaLabels.openMyProfile")}
							className="user-card-button"
						>
							{t("userCard.profile")}
						</MainButton>
					) : (
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
					)}
				</div>
			</article>
		</Link>
	);
};
