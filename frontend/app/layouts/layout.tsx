import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router";
import { AuthModal } from "~/components/auth/AuthModal";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { Footer } from "./Footer";
import { Header } from "./Header";

export type LayoutOutletContext = {
	isAuthenticated: boolean;
	openAuthModal: (onSuccessAction?: () => void) => void;
};

const Layout = () => {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const authSuccessActionRef = useRef<(() => void) | null>(null);
	const openAuthModal = (onSuccessAction?: () => void) => {
		authSuccessActionRef.current = onSuccessAction ?? null;
		setIsAuthModalOpen(true);
	};

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

	useEffect(() => {
		if (!isAuthenticated) {
			return;
		}

		const sendHeartbeat = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/users/me/heartbeat`, {
					method: "POST",
					credentials: "include",
				});
				if (response.status === 401) {
					setIsAuthenticated(false);
				}
			} catch (error) {
				console.error(`Heartbeat failed: ${error}`);
			}
		};

		void sendHeartbeat();
		const interval = setInterval(() => void sendHeartbeat(), 30_000);
		return () => clearInterval(interval);
	}, [isAuthenticated]);

	return (
		<div className="app-shell">
			<Header
				isAuthenticated={isAuthenticated}
				onOpenAuthModal={() => openAuthModal()}
			/>
			<main className="app-main">
				<Outlet context={{ isAuthenticated, openAuthModal }} />
			</main>
			<Footer
				isAuthenticated={isAuthenticated}
				onOpenAuthModal={() => openAuthModal()}
			/>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => {
					setIsAuthModalOpen(false);
					authSuccessActionRef.current = null;
				}}
				onSuccess={() => {
					setIsAuthenticated(true);
					setIsAuthModalOpen(false);
					authSuccessActionRef.current?.();
					authSuccessActionRef.current = null;
				}}
			/>
		</div>
	);
};

export default Layout;
