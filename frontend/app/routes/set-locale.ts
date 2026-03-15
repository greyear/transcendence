import { data, type ActionFunctionArgs } from "react-router";
import { localeCookie } from "~/i18next.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const locale = formData.get("locale");

  return data(
    { success: true },
    {
      headers: {
        "Set-Cookie": await localeCookie.serialize(locale),
      },
    }
  );
}