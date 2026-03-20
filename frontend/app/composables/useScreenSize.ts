import { useEffect, useState } from "react";

type ScreenSizes = "mobile" | "tablet" | "desktop";

export const useScreenSize = () => {
	const [screenSize, setScreenSize] = useState<ScreenSizes>("mobile");

	useEffect(() => {
		if (typeof window === "undefined") return;

		const updateDimensions = () => {
			const width = window.innerWidth;
			const currentScreenSize: ScreenSizes =
				width < 768 ? "mobile" : width >= 1440 ? "desktop" : "tablet";
			setScreenSize(currentScreenSize);
		};

		updateDimensions();
		window.addEventListener("resize", updateDimensions);

		return () => {
			window.removeEventListener("resize", updateDimensions);
		};
	}, []);

	return { screenSize };
};
