import { useTranslation } from "react-i18next";
import {
	Links,
	Meta,
	type MetaFunction,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";
import "./index.scss";
import type { Route } from "./+types/root";
import i18next from "./i18next.server";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const locale = await i18next.getLocale(request);
	return { locale };
};

export const meta: MetaFunction = () => {
	return [
		{ title: "Transcendence — Cooking Community" },
		{ charSet: "utf-8" },
		{ name: "viewport", content: "width=device-width, initial-scale=1" },
		{
			name: "description",
			content: "Discover and share the best recipes with our community.",
		},

		{ property: "og:title", content: "Transcendence Recipes" },
		{ property: "og:type", content: "website" },
	];
};

const App = () => {
	const { locale } = useLoaderData<typeof loader>();
	const { i18n } = useTranslation();

	return (
		<html lang={i18n.resolvedLanguage ?? locale ?? "en"} dir="ltr">
			<head>
				<Meta />
				<Links />
			</head>
			<body>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
};

export default App;
