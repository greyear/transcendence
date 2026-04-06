import { CookCard } from "./cards/CookCard";
import "~/assets/styles/cooksRow.css";
import { useEffect, useState } from "react";

type CookCardResponse = {
	id: number;
	username: string;
	avatar: string | null;
	recipes_count: number;
};

export const CooksRow = () => {
	const [cookList, setCookList] = useState<CookCardResponse[]>([]);
	useEffect(() => {
		fetch("http://localhost:3000/users")
			.then((res) => {
				if (!res.ok) {
					console.log("The user database is empty.");
					return { data: [] };
				}
				return res.json();
			})
			.then((body) => {
				const allCooks: CookCardResponse[] = body.data ?? [];
				setCookList(allCooks);
			})
			.catch(console.error);
	}, []);

	const visibleCooks = [...cookList].sort(
		(a, b) => b.recipes_count - a.recipes_count,
	);

	return (
		<ul className="cooks-row">
			{visibleCooks.map(({ id, username, avatar }) => (
				<li key={id}>
					<CookCard id={id} username={username} avatar={avatar} />
				</li>
			))}
		</ul>
	);
};
