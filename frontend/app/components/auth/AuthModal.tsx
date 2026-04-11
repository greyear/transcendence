import { useEffect } from "react";
import { AuthForm } from "./AuthForm";

type AuthModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
};

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) {
		return null;
	}

	return (
		<div className="auth-modal-backdrop" role="presentation">
			<AuthForm onClose={onClose} onSuccess={onSuccess} />
		</div>
	);
};
