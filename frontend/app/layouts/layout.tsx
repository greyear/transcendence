import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router";
import { z } from "zod";
import { AuthModal } from "~/components/auth/AuthModal";
import { Notice } from "~/components/Notice";
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
	resetAuthState: () => void;
	showNotice: (message: string) => void;
};

const SessionResponseSchema = z.object({ authenticated: z.boolean() });
const AuthMeResponseSchema = z.object({ id: z.number() });

const Layout = () => {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAuthResolved, setIsAuthResolved] = useState(false);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
	const authSuccessActionRef = useRef<(() => void) | null>(null);
	const authCancelActionRef = useRef<(() => void) | null>(null);
	const showNotice = useCallback((message: string) => {
		setNoticeMessage(message);
	}, []);
	const dismissNotice = useCallback(() => {
		setNoticeMessage(null);
	}, []);
	const resetAuthState = useCallback(() => {
		setIsAuthenticated(false);
		setCurrentUserId(null);
	}, []);

	const restoreAuthState = useCallback(async () => {
		try {
			const sessionResponse = await fetch(`${API_BASE_URL}/auth/session`, {
				credentials: "include",
			});

			if (!sessionResponse.ok) {
				resetAuthState();
				return;
			}

			const sessionBody: unknown = await sessionResponse.json();
			const parsedSession = SessionResponseSchema.safeParse(sessionBody);
			if (!parsedSession.success || !parsedSession.data.authenticated) {
				resetAuthState();
				return;
			}

			const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
				credentials: "include",
			});
			if (!meResponse.ok) {
				resetAuthState();
				return;
			}

			const meBody: unknown = await meResponse.json();
			const parsedMe = AuthMeResponseSchema.safeParse(meBody);
			if (!parsedMe.success) {
				resetAuthState();
				return;
			}

			setCurrentUserId(parsedMe.data.id);
			setIsAuthenticated(true);
		} catch {
			resetAuthState();
		} finally {
			setIsAuthResolved(true);
		}
	}, [resetAuthState]);

	const openAuthModal = (
		onSuccessAction?: () => void,
		onCancelAction?: () => void,
	) => {
		authSuccessActionRef.current = onSuccessAction ?? null;
		authCancelActionRef.current = onCancelAction ?? null;
		setIsAuthModalOpen(true);
	};

	useEffect(() => {
		void restoreAuthState();
	}, [restoreAuthState]);

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
					resetAuthState();
				}
			} catch (error) {
				console.error(`Heartbeat failed: ${error}`);
			}
		};

		void sendHeartbeat();
		const interval = setInterval(() => void sendHeartbeat(), 30_000);
		return () => clearInterval(interval);
	}, [isAuthenticated, resetAuthState]);

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
						resetAuthState,
						showNotice,
					}}
				/>
			</main>
			<Footer
				isAuthenticated={isAuthenticated}
				onOpenAuthModal={() => openAuthModal()}
			/>
			<Notice message={noticeMessage} onDismiss={dismissNotice} />
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => {
					setIsAuthModalOpen(false);
					authCancelActionRef.current?.();
					authSuccessActionRef.current = null;
					authCancelActionRef.current = null;
				}}
				onSuccess={() => {
					setIsAuthModalOpen(false);
					void restoreAuthState();
					authSuccessActionRef.current?.();
					authSuccessActionRef.current = null;
					authCancelActionRef.current = null;
				}}
			/>
		</div>
	);
};

export default Layout;
