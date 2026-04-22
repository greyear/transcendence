import { useRef } from "react";
import { Modal } from "~/components/Modal";
import { ChangePasswordForm } from "./ChangePasswordForm";

type ChangePasswordModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	userId: number | null;
};

export const ChangePasswordModal = ({
	isOpen,
	onClose,
	onSuccess,
	userId,
}: ChangePasswordModalProps) => {
	const dialogRef = useRef<HTMLElement>(null);

	return (
		<Modal isOpen={isOpen} onClose={onClose} dialogRef={dialogRef}>
			<ChangePasswordForm
				dialogRef={dialogRef}
				onClose={onClose}
				onSuccess={onSuccess}
				userId={userId}
			/>
		</Modal>
	);
};
