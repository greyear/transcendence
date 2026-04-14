import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

export type ProfileData = {
	id: number;
	username: string;
	avatar: string | null;
};

type AuthContextType = {
	isAuthenticated: boolean;
	isAuthLoading: boolean;
	profile: ProfileData | null;
	signIn: () => void;
	signOut: () => void;
	setProfile: (profile: ProfileData) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function isProfileBody(v: unknown): v is { data?: ProfileData } {
	return typeof v === "object" && v !== null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAuthLoading, setIsAuthLoading] = useState(true);
	const [profile, setProfileState] = useState<ProfileData | null>(null);

	useEffect(() => {
		let ignore = false;

		const restoreAuthState = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/profile`, {
					credentials: "include",
				});

				if (ignore) return;

				if (response.ok) {
					const body: unknown = await response.json();
					if (!ignore && isProfileBody(body) && body.data) {
						setIsAuthenticated(true);
						setProfileState(body.data);
					}
				}
			} catch {
				// network error — stay unauthenticated
			} finally {
				if (!ignore) setIsAuthLoading(false);
			}
		};

		void restoreAuthState();
		return () => {
			ignore = true;
		};
	}, []);

	const signIn = () => {
		setIsAuthenticated(true);
		setProfileState(null);
	};

	const signOut = () => {
		setIsAuthenticated(false);
		setProfileState(null);
	};

	const setProfile = (p: ProfileData) => {
		setProfileState(p);
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				isAuthLoading,
				profile,
				signIn,
				signOut,
				setProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextType => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
};
