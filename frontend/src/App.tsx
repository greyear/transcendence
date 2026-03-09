import { Plus } from "iconoir-react";
import { MainButton } from "./components/buttons/MainButton";

function App() {
	return (
		<>
			<MainButton>
				<Plus />
				Create new
			</MainButton>
			<MainButton>Log in/sign up</MainButton>
			<MainButton disabled>Disabled</MainButton>
			<MainButton variant="primary">Primary</MainButton>
			<MainButton variant="pill" active>My recipes</MainButton>
			<MainButton variant="pill">My recipes</MainButton>
			<MainButton variant="danger">Block</MainButton>
			<MainButton variant="secondary">Unblock</MainButton>
		</>
	);
}

export default App;
