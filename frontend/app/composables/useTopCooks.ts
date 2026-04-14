import { useEffect, useState } from "react";
import { API_BASE_URL } from "./apiBaseUrl";

export type TopCook = {
	id: number;
	username: string;
	avatar: string | null;
	recipes_count: number;
};

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
					const message = `Failed to fetch users: ${res.status}`;
					console.error(message);
					setErrorStatus(res.status);
					return { data: [] };
				}
				return res.json();
			})
			.then((body) => {
				const allCooks: TopCook[] = body.data ?? [];
				const sortedCooks = [...allCooks].sort(
					(a, b) => b.recipes_count - a.recipes_count,
				);
				setCookList(sortedCooks);
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
