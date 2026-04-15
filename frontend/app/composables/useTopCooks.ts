import { useEffect, useState } from "react";
import { z } from "zod";
import { API_BASE_URL } from "./apiBaseUrl";

const TopCookSchema = z.object({
	id: z.number(),
	username: z.string(),
	avatar: z.string().nullable(),
	recipes_count: z.number(),
});

const TopCooksResponseSchema = z.object({
	data: z.array(TopCookSchema),
});

export type TopCook = z.infer<typeof TopCookSchema>;

export const useTopCooks = () => {
	const [cookList, setCookList] = useState<TopCook[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);
	useEffect(() => {
		fetch(`${API_BASE_URL}/users`)
			.then((res) => {
				if (!res.ok) {
					console.error(`Failed to fetch users: ${res.status}`);
					setErrorStatus(res.status);
					return null;
				}
				return res.json();
			})
			.then((body) => {
				if (body === null) {
					return;
				}
				const parsed = TopCooksResponseSchema.safeParse(body);
				if (!parsed.success) {
					console.error("Unexpected /users response shape", parsed.error);
					setErrorStatus("unknown");
					return;
				}
				const sorted = [...parsed.data.data].sort(
					(a, b) => b.recipes_count - a.recipes_count,
				);
				setCookList(sorted);
			})
			.catch((error: unknown) => {
				console.error(error);
				setErrorStatus("unknown");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);
	return { cookList, isLoading, errorStatus };
};
