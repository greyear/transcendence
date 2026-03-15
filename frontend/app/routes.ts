import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("/recipe/:id", "routes/recipe.tsx"),
	route("/set-locale", "routes/set-locale.ts"),
] satisfies RouteConfig;
