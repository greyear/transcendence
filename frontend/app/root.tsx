import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData
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

	return (
		<html lang={locale} dir="ltr">
			<head>
				<meta charSet="utf-8" />
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
