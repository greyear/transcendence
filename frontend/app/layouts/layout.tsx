import { useState } from "react";
import { Outlet } from "react-router";
import { AuthModal } from "~/components/auth/AuthModal";
import { AuthProvider, useAuth } from "~/contexts/AuthContext";
import { Footer } from "./Footer";
import { Header } from "./Header";

const LayoutContent = () => {
	const { isAuthenticated, signIn } = useAuth();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
					signIn();
					setIsAuthModalOpen(false);
				}}
			/>
		</>
	);
};

const Layout = () => (
	<AuthProvider>
		<LayoutContent />
	</AuthProvider>
);

export default Layout;
