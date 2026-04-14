const MIN_SCROLL_AMOUNT = 240;

export const getScrollAmount = (list: HTMLUListElement | null) => {
	if (!list) {
		return MIN_SCROLL_AMOUNT;
	}

	const firstItem =
		list.firstElementChild instanceof HTMLLIElement
			? list.firstElementChild
			: null;

	if (!firstItem) {
		return Math.max(list.clientWidth * 0.8, MIN_SCROLL_AMOUNT);
	}

	const styles = window.getComputedStyle(list);
	const gap = Number.parseFloat(styles.gap || "0");
	const itemWidth = firstItem.getBoundingClientRect().width;
	const step = itemWidth + gap;

	if (step <= 0) {
		return Math.max(list.clientWidth * 0.8, MIN_SCROLL_AMOUNT);
	}

	const visibleItems = Math.max(1, Math.floor((list.clientWidth + gap) / step));

	return visibleItems * step;
};
