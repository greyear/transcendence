import { reactRouter } from "@react-router/dev/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [basicSsl(), reactRouter(), tsconfigPaths()],
});