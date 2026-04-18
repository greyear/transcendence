import { Link } from "react-router";
import "../../assets/styles/cookCard.css";
import userPhoto from "../../assets/images/user-photo.jpg";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";

type CookCardProps = {
	id: number;
	username: string;
	avatar?: string | null;
};

export const CookCard = ({ id, username, avatar }: CookCardProps) => {
	const avatarSrc = resolveMediaUrl(avatar) ?? userPhoto;

	return (
		<Link to={`/user/${id}`} className="cook-card-link">
			<div className="cook-card-item">
				<img
					src={avatarSrc}
					alt={`${username} profile`}
					className="cook-card-image"
				/>
				<p className="cook-card-name text-body3">{username}</p>
			</div>
		</Link>
	);
};
