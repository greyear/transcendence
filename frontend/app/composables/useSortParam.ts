import { useSearchParams } from "react-router";

export const useSortParam = (defaultValue: string) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const sort = searchParams.get("sort") ?? defaultValue;

	const setSort = (value: string) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (value === defaultValue) {
					next.delete("sort");
				} else {
					next.set("sort", value);
				}
				next.delete("page");
				return next;
			},
			{ replace: true },
		);
	};

	return [sort, setSort] as const;
};
