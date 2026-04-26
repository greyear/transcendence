import { useTranslation } from "react-i18next";
import {
	Links,
	Meta,
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
	const t = await i18next.getFixedT(request);
	return {
		locale,
		meta: {
			title: t("siteMeta.title"),
			description: t("siteMeta.description"),
			ogTitle: t("siteMeta.ogTitle"),
		},
	};
};

export const meta: Route.MetaFunction = ({ data }) => [
	{ title: data?.meta.title },
	{ charSet: "utf-8" },
	{ name: "viewport", content: "width=device-width, initial-scale=1" },
	{ name: "description", content: data?.meta.description },
	{ property: "og:title", content: data?.meta.ogTitle },
	{ property: "og:type", content: "website" },
];

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
