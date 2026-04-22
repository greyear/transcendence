import "~/assets/styles/confirmationModal.css";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { MainButton } from "~/components/buttons/MainButton";
import { Modal } from "~/components/Modal";

type ConfirmationModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void | Promise<void>;
	title: string;
	confirmLabel: string;
	isConfirming?: boolean;
	description?: string;
};

export const ConfirmationModal = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	confirmLabel,
	isConfirming = false,
	description,
}: ConfirmationModalProps) => {
	const { t } = useTranslation();
	const dialogRef = useRef<HTMLElement>(null);

	return (
		<Modal isOpen={isOpen} onClose={onClose} dialogRef={dialogRef}>
			<section
				className="confirmation-card"
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirmation-modal-title"
				tabIndex={-1}
			>
				<div className="confirmation-card-body">
					<h2
						className="confirmation-modal-title"
						id="confirmation-modal-title"
					>
						{title}
					</h2>
					{description ? (
						<p className="confirmation-modal-description text-body3">
							{description}
						</p>
					) : null}
				</div>
				<div className="confirmation-modal-actions">
					<MainButton
						variant="inverted"
						onClick={onClose}
						disabled={isConfirming}
					>
						{t("common.cancel")}
					</MainButton>
					<MainButton
						variant="danger"
						onClick={() => {
							void onConfirm();
						}}
						disabled={isConfirming}
						aria-busy={isConfirming}
					>
						{confirmLabel}
					</MainButton>
				</div>
			</section>
		</Modal>
	);
};
