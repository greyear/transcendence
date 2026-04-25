import { data } from "react-router";
import { NotFoundView } from "~/components/NotFoundView";

export const loader = () => data(null, { status: 404 });

const NotFoundPage = () => {
	return <NotFoundView />;
};

export default NotFoundPage;
