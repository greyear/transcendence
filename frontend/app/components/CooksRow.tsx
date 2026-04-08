import { CookCard } from "./cards/CookCard";
import "~/assets/styles/cooksRow.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

type CookCardResponse = {
	id: number;
	username: string;
	avatar: string | null;
	recipes_count: number;
};

export const CooksRow = () => {
	const { t } = useTranslation();
	const [cookList, setCookList] = useState<CookCardResponse[]>([]);
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
				const allCooks: CookCardResponse[] = body.data ?? [];
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

	if (isLoading) {
		return <p className="cooks-row-status">{t("cooksRow.loading")}</p>;
	}

	if (errorStatus !== null) {
		return (
			<p className="cooks-row-status">
				{t("cooksRow.error", { status: errorStatus })}
			</p>
		);
	}

	if (cookList.length === 0) {
		return <p className="cooks-row-status">{t("cooksRow.empty")}</p>;
	}

	return (
		<ul className="cooks-row">
			{cookList.map(({ id, username, avatar }) => (
				<li key={id}>
					<CookCard id={id} username={username} avatar={avatar} />
				</li>
			))}
		</ul>
	);
};
