import { useState } from "react";
import { Outlet } from "react-router";
import { AuthModal } from "~/components/auth/AuthModal";
import { Footer } from "./Footer";
import { Header } from "./Header";

const Layout = () => {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

	return (
		<>
			<Header onOpenAuthModal={() => setIsAuthModalOpen(true)} />
			<main>
				<Outlet />
			</main>
			<Footer onOpenAuthModal={() => setIsAuthModalOpen(true)} />
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				onSuccess={() => setIsAuthModalOpen(false)}
			/>
		</>
	);
};

export default Layout;
