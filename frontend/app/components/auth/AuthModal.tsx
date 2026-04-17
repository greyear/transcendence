import { useRef } from "react";
import { Modal } from "~/components/Modal";
import { AuthForm } from "./AuthForm";

type AuthModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
};

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
	const dialogRef = useRef<HTMLElement>(null);

	return (
		<Modal isOpen={isOpen} onClose={onClose} dialogRef={dialogRef}>
			<AuthForm dialogRef={dialogRef} onClose={onClose} onSuccess={onSuccess} />
		</Modal>
	);
};
