import { Outlet } from "react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";

const Layout = () => (
	<>
		<Header />
		<main>
			<Outlet />
		</main>
		<Footer />
	</>
);

export default Layout;
