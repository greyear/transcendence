import { useSearchParams } from "react-router";

export const PER_PAGE_OPTIONS = [12, 24, 36, 48] as const;
export const DEFAULT_PER_PAGE = 12;

export const usePerPageParam = (
	defaultValue: number = DEFAULT_PER_PAGE,
	options: readonly number[] = PER_PAGE_OPTIONS,
) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const raw = searchParams.get("perPage");
	const parsed = raw === null ? Number.NaN : Number(raw);
	const perPage =
		Number.isFinite(parsed) && options.includes(parsed) ? parsed : defaultValue;

	const setPerPage = (value: number) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (value === defaultValue) {
					next.delete("perPage");
				} else {
					next.set("perPage", String(value));
				}
				next.delete("page");
				return next;
			},
			{ replace: true },
		);
	};

	return [perPage, setPerPage] as const;
};
