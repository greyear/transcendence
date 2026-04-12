import { useState } from "react";
import { Outlet } from "react-router";
import { AuthModal } from "~/components/auth/AuthModal";
import { Footer } from "./Footer";
import { Header } from "./Header";

const Layout = () => {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	return (
		<>
			<Header
				isAuthenticated={isAuthenticated}
				onOpenAuthModal={() => setIsAuthModalOpen(true)}
			/>
			<main>
				<Outlet />
			</main>
			<Footer
				isAuthenticated={isAuthenticated}
				onOpenAuthModal={() => setIsAuthModalOpen(true)}
			/>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				onSuccess={() => {
					setIsAuthenticated(true);
					setIsAuthModalOpen(false);
				}}
			/>
		</>
	);
};

export default Layout;
