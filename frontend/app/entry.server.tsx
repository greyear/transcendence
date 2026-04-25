import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { createInstance } from "i18next";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import i18n from "./i18n";
import i18next from "./i18next.server";
import resources from "./locales";

export const streamTimeout = 5_000;

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
	_loadContext: AppLoadContext,
) {
	const i18nextInstance = createInstance();
	const lng = await i18next.getLocale(request);
	const namespaces = i18next.getRouteNamespaces(routerContext);

	await i18nextInstance.use(initReactI18next).init({
		...i18n,
		lng,
		ns: namespaces,
		resources,
	});

	let shellRendered = false;
	const userAgent = request.headers.get("user-agent");

	// Ensure requests from bots and SPA Mode renders wait for all content to load before responding
	const readyOption: keyof RenderToPipeableStreamOptions =
		(userAgent && isbot(userAgent)) || routerContext.isSpaMode
			? "onAllReady"
			: "onShellReady";

	return new Promise<Response>((resolve, reject) => {
		const { pipe, abort } = renderToPipeableStream(
			<I18nextProvider i18n={i18nextInstance}>
				<ServerRouter context={routerContext} url={request.url} />
			</I18nextProvider>,
			{
				[readyOption]() {
					shellRendered = true;
					const body = new PassThrough();
					const stream = createReadableStreamFromReadable(body);

					responseHeaders.set("Content-Type", "text/html; charset=utf-8");

					pipe(body);

					resolve(
						new Response(stream, {
							headers: responseHeaders,
							status: responseStatusCode,
						}),
					);
				},
				onShellError(error: unknown) {
					reject(error);
				},
				onError(error: unknown) {
					responseStatusCode = 500;
					if (shellRendered) {
						console.error(error);
					}
				},
			},
		);

		setTimeout(abort, streamTimeout + 1000);
	});
}
