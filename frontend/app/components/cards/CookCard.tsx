import { Link } from "react-router";
import "../../assets/styles/cookCard.css";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import userPhoto from "../../assets/images/user-photo.jpg";

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
				<img src={avatar || userPhoto} alt="" className="cook-card-image" />
				<p className="cook-card-name text-body3">{username}</p>
			</div>
		</Link>
	);
};
