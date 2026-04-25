import "~/assets/styles/modal.scss";
import { type ReactNode, type RefObject, useLayoutEffect } from "react";

type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	dialogRef: RefObject<HTMLElement | null>;
	children: ReactNode;
};

const FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
].join(",");

const INITIAL_FOCUS_SELECTOR = "[data-initial-focus]";

export const Modal = ({ isOpen, onClose, dialogRef, children }: ModalProps) => {
	useLayoutEffect(() => {
		if (!isOpen) {
			return;
		}

		const dialog = dialogRef.current;
		if (!dialog) {
			return;
		}

		const previousActiveElement =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const getFocusableElements = () =>
			Array.from(
				dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			).filter((element) => !element.hasAttribute("disabled"));

		const initialFocusableElement =
			dialog.querySelector<HTMLElement>(INITIAL_FOCUS_SELECTOR) ??
			getFocusableElements()[0];

		if (initialFocusableElement) {
			initialFocusableElement.focus();
		} else {
			dialog.focus();
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
				return;
			}

			if (event.key !== "Tab") {
				return;
			}

			const focusableElements = getFocusableElements();
			if (focusableElements.length === 0) {
				event.preventDefault();
				dialog.focus();
				return;
			}

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];
			const activeElement = document.activeElement;
			const isOutsideDialog =
				!(activeElement instanceof Node) || !dialog.contains(activeElement);

			if (
				event.shiftKey &&
				(activeElement === firstElement ||
					activeElement === dialog ||
					isOutsideDialog)
			) {
				event.preventDefault();
				lastElement.focus();
			}

			if (
				!event.shiftKey &&
				(activeElement === lastElement || isOutsideDialog)
			) {
				event.preventDefault();
				firstElement.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", handleKeyDown);
			previousActiveElement?.focus();
		};
	}, [isOpen, onClose, dialogRef]);

	if (!isOpen) {
		return null;
	}

	return (
		<div className="modal-backdrop" role="presentation">
			{children}
		</div>
	);
};
