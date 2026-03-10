import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { RecipePage } from "./pages/RecipePage";

const routes = [
	{ path: "/", element: <HomePage /> },
	{ path: "/recipe-page", element: <RecipePage /> },
];

function App() {
	return (
		<Routes>
			{routes.map((route) => (
				<Route key={route.path} path={route.path} element={route.element} />
			))}
		</Routes>
	);
}

export default App;
