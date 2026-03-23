import { Outlet } from "react-router";
import { Footer } from "./Footer";

const Layout = () => (
	<>
		{/* <Header /> */}
		<Outlet />
		<Footer />
	</>
);

export default Layout;
