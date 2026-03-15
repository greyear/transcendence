import { type ActionFunctionArgs, data } from "react-router";
import i18n from "~/i18n";
import { localeCookie } from "~/i18next.server";

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const locale = formData.get("locale");

	return data(
		{ success: true },
		{
			headers: {
				"Set-Cookie": localeCookie.serialize(
					String(locale ?? i18n.fallbackLng),
				),
			},
		},
	);
}
