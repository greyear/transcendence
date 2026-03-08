import { Bell, Menu, XmarkCircle } from "iconoir-react"
import { IconButton } from "../components/buttons/IconButton"
import { MainButton } from "../components/buttons/MainButton"
import { useState } from "react"

export const Header = () => {
	const [isOpen, setIsOpen] = useState(false)

	const handleMenuButtonClick = () => setIsOpen((prev) => !prev);

	return (
		<header>
			<div className="header-top-row">
				<h2>RCP</h2>
				<div className="header-top-icon-row">
					<IconButton aria-label="Notifications">
						<Bell />
					</IconButton>
					<IconButton
						onClick={handleMenuButtonClick}
						aria-expanded={isOpen}
						aria-label="Toggle menu"
					>
						{isOpen ? <XmarkCircle /> : <Menu />}
					</IconButton>
				</div>
			</div>
			{isOpen &&
				<>
					<nav>
						<ul className="header-navigation-list" role="list">
							<li>Home</li>
							<li>Recipes</li>
							<li>People</li>
							<li>
								<MainButton>Log in/Sign up</MainButton>
							</li>
						</ul>
					</nav>
					{/* Searchbar */}
					<div className="lang-row">
						{/* Lang buttons */}
					</div>
				</>
			}
		</header>
	)
}