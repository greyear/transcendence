import {
	index,
	layout,
	type RouteConfig,
	route,
} from "@react-router/dev/routes";

export default [
	layout("layouts/layout.tsx", [
		index("routes/home.tsx"),
		route("/recipes/:id", "routes/recipe.tsx"),
		route("/users", "routes/users.tsx"),
		route("/recipes", "routes/recipes.tsx"),
	]),
	route("/set-locale", "routes/set-locale.ts"),
] satisfies RouteConfig;
