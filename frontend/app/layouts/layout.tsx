import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { AuthModal } from "~/components/auth/AuthModal";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { Footer } from "./Footer";
import { Header } from "./Header";

const Layout = () => {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		const restoreAuthState = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/profile`, {
					credentials: "include",
				});

				setIsAuthenticated(response.ok);
			} catch {
				setIsAuthenticated(false);
			}
		};

		void restoreAuthState();
	}, []);

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
