import { useEffect, useState } from "react";

type ScreenSizes = "mobile" | "tablet" | "desktop";

const getScreenSize = (width: number): ScreenSizes =>
	width < 768 ? "mobile" : width >= 1440 ? "desktop" : "tablet";

export const useScreenSize = () => {
	const [screenSize, setScreenSize] = useState<ScreenSizes>("mobile");

	useEffect(() => {
		const updateDimensions = () =>
			setScreenSize(getScreenSize(window.innerWidth));

		updateDimensions();
		window.addEventListener("resize", updateDimensions);

		return () => window.removeEventListener("resize", updateDimensions);
	}, []);

	return { screenSize };
};
