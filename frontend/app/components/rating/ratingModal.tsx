import { useRef } from "react";
import { Modal } from "~/components/Modal";
import { RatingForm } from "./ratingForm";

type RatingModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void | Promise<void>;
	recipeId: string;
	initialRating: number | null;
};

export const RatingModal = ({
	isOpen,
	onClose,
	onSuccess,
	recipeId,
	initialRating,
}: RatingModalProps) => {
	const dialogRef = useRef<HTMLElement>(null);

	return (
		<Modal isOpen={isOpen} onClose={onClose} dialogRef={dialogRef}>
			<RatingForm
				dialogRef={dialogRef}
				onClose={onClose}
				onSuccess={onSuccess}
				recipeId={recipeId}
				initialRating={initialRating}
			/>
		</Modal>
	);
};
