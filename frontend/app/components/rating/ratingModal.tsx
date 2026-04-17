import { useRef } from "react";
import { Modal } from "~/components/Modal";
import { RatingForm } from "./ratingForm";

type RatingModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export const RatingModal = ({ isOpen, onClose }: RatingModalProps) => {
	const dialogRef = useRef<HTMLElement>(null);

	return (
		<Modal isOpen={isOpen} onClose={onClose} dialogRef={dialogRef}>
			<RatingForm dialogRef={dialogRef} onClose={onClose} />
		</Modal>
	);
};
