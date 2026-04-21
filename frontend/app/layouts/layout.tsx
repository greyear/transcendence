import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router";
import { z } from "zod";
import { AuthModal } from "~/components/auth/AuthModal";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { Footer } from "./Footer";
import { Header } from "./Header";

export type LayoutOutletContext = {
	isAuthenticated: boolean;
	isAuthResolved: boolean;
	openAuthModal: (
		onSuccessAction?: () => void,
		onCancelAction?: () => void,
	) => void;
	currentUserId: number | null;
};

const ProfileIdSchema = z.object({ data: z.object({ id: z.number() }) });

const Layout = () => {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAuthResolved, setIsAuthResolved] = useState(false);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const authSuccessActionRef = useRef<(() => void) | null>(null);
	const authCancelActionRef = useRef<(() => void) | null>(null);
	const openAuthModal = (
		onSuccessAction?: () => void,
		onCancelAction?: () => void,
	) => {
		authSuccessActionRef.current = onSuccessAction ?? null;
		authCancelActionRef.current = onCancelAction ?? null;
		setIsAuthModalOpen(true);
	};

	useEffect(() => {
		const restoreAuthState = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/profile`, {
					credentials: "include",
				});

				if (!response.ok) {
					setIsAuthenticated(false);
					setCurrentUserId(null);
					return;
				}

				setIsAuthenticated(true);
				const body: unknown = await response.json();
				const parsed = ProfileIdSchema.safeParse(body);
				setCurrentUserId(parsed.success ? parsed.data.data.id : null);
			} catch {
				setIsAuthenticated(false);
			} finally {
				setIsAuthResolved(true);
				setCurrentUserId(null);
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
					setCurrentUserId(null);
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
				<Outlet
					context={{
						isAuthenticated,
						isAuthResolved,
						currentUserId,
						openAuthModal,
					}}
				/>
			</main>
			<Footer
				isAuthenticated={isAuthenticated}
				onOpenAuthModal={() => openAuthModal()}
			/>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => {
					setIsAuthModalOpen(false);
					authCancelActionRef.current?.();
					authSuccessActionRef.current = null;
					authCancelActionRef.current = null;
				}}
				onSuccess={() => {
					setIsAuthenticated(true);
					setIsAuthModalOpen(false);
					void fetch(`${API_BASE_URL}/profile`, { credentials: "include" })
						.then((res) => (res.ok ? res.json() : null))
						.then((body: unknown) => {
							const parsed = ProfileIdSchema.safeParse(body);
							setCurrentUserId(parsed.success ? parsed.data.data.id : null);
						})
						.catch(() => setCurrentUserId(null));
					authSuccessActionRef.current?.();
					authSuccessActionRef.current = null;
					authCancelActionRef.current = null;
				}}
			/>
		</div>
	);
};

export default Layout;
