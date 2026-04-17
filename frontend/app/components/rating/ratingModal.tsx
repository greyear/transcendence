import { useRef } from "react";
import { Modal } from "~/components/Modal";
import { RatingForm } from "./ratingForm";

type RatingModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void | Promise<void>;
	recipeId: string;
};

export const RatingModal = ({
	isOpen,
	onClose,
	onSuccess,
	recipeId,
}: RatingModalProps) => {
	const dialogRef = useRef<HTMLElement>(null);

	return (
		<Modal isOpen={isOpen} onClose={onClose} dialogRef={dialogRef}>
			<RatingForm
				dialogRef={dialogRef}
				onClose={onClose}
				onSuccess={onSuccess}
				recipeId={recipeId}
			/>
		</Modal>
	);
};
