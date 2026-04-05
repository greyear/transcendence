import { Link } from "react-router";
import "../../assets/styles/cookCard.css";
import userPhoto from "../../assets/images/user-photo.jpg";

type CookCardProps = {
	id: number;
	name: string;
	image?: string;
};

export const CookCard = ({ id, name, image }: CookCardProps) => {
	return (
		<Link to={`/user/${id}`} className="cook-card-link">
			<div className="cook-card-item">
				<img
					src={image || userPhoto}
					alt={`${name} profile`}
					className="cook-card-image"
				/>
				<p className="cook-card-name text-body3">{name}</p>
			</div>
		</Link>
	);
};
