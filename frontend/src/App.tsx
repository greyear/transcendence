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
		</>
	);
}

export default App;
