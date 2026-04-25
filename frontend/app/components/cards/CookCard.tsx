import { Link } from "react-router";
import "../../assets/styles/cookCard.css";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import defaultAvatar from "../../assets/images/default-avatar.jpeg";

type CookCardProps = {
	id: number;
	username: string;
	avatar?: string | null;
};

export const CookCard = ({ id, username, avatar }: CookCardProps) => {
	const avatarSrc = resolveMediaUrl(avatar) ?? defaultAvatar;

	return (
		<Link to={`/user/${id}`} className="cook-card-link">
			<div className="cook-card-item">
				<img src={avatarSrc} alt="" className="cook-card-image" />
				<p className="cook-card-name text-body3">{username}</p>
			</div>
		</Link>
	);
};
