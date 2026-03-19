import {
	index,
	layout,
	type RouteConfig,
	route,
} from "@react-router/dev/routes";

export default [
	layout("layouts/layout.tsx", [
		index("routes/home.tsx"),
		route("/recipe/:id", "routes/recipe.tsx"),
	]),
	route("/set-locale", "routes/set-locale.ts"),
] satisfies RouteConfig;
