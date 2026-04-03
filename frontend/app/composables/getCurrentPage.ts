export const getCurrentPage = (
	searchParams: URLSearchParams,
	totalPagesCount: number,
): number => {
	const pageAttr = searchParams.get("page");
	if (!pageAttr) {
		return 1;
	}

	const page = Number(pageAttr);
	if (Number.isNaN(page) || !Number.isInteger(page) || page < 1) {
		return 1;
	}

	if (page > totalPagesCount) {
		return totalPagesCount;
	}

	return page;
};
