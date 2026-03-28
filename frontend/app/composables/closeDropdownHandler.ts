export const handleDropdowClose = (
	itemRef: HTMLElement,
	setIsOpen: (isOpen: boolean) => void,
) => {
	const handlePointerDown = (e: PointerEvent) => {
		if (e.target instanceof Node && !itemRef.contains(e.target)) {
			setIsOpen(false);
		}
	};

	const handleFocusOut = (e: FocusEvent) => {
		if (e.relatedTarget instanceof Node && !itemRef.contains(e.relatedTarget)) {
			setIsOpen(false);
		}
	};

	document.addEventListener("pointerdown", handlePointerDown);
	itemRef.addEventListener("focusout", handleFocusOut);
	return () => {
		document.removeEventListener("pointerdown", handlePointerDown);
		itemRef.removeEventListener("focusout", handleFocusOut);
	};
};
