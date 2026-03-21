import { useTranslation } from "react-i18next";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";
import "@fontsource/nunito/300.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/500.css";
import "@fontsource/nunito/700.css";
import "./index.css";
import type { Route } from "./+types/root";
import i18next from "./i18next.server";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const locale = await i18next.getLocale(request);
	return { locale };
};

const App = () => {
	const { locale } = useLoaderData<typeof loader>();
	const { i18n } = useTranslation();

	return (
		<html lang={i18n.resolvedLanguage ?? locale} dir="ltr">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
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
