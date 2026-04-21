import { useRef } from "react";
import { Modal } from "~/components/Modal";
import { ReviewForm } from "./reviewForm";

type ReviewModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void | Promise<void>;
	recipeId: string;
};

export const ReviewModal = ({
	isOpen,
	onClose,
	onSuccess,
	recipeId,
}: ReviewModalProps) => {
	const dialogRef = useRef<HTMLElement>(null);

	return (
		<Modal isOpen={isOpen} onClose={onClose} dialogRef={dialogRef}>
			<ReviewForm
				dialogRef={dialogRef}
				onClose={onClose}
				onSuccess={onSuccess}
				recipeId={recipeId}
			/>
		</Modal>
	);
};
