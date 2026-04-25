import { CheckCircle, XmarkCircle } from "iconoir-react";
import { IconButton } from "./IconButton";
import "../../assets/styles/moderationButton.css";
import { useTranslation } from "react-i18next";

type ModerationAction = "approve" | "discard";

type Props = {
	action: ModerationAction;
	onClick?: (e: React.MouseEvent<HTMLElement>) => void;
	disabled?: boolean;
};

export const ModerationButton = ({
	action,
	onClick,
	disabled = false,
}: Props) => {
	const { t } = useTranslation();
	const handleClick = (e: React.MouseEvent<HTMLElement>) => {
		e.stopPropagation();
		e.preventDefault();
		onClick?.(e);
	};

	const isApprove = action === "approve";

	return (
		<IconButton
			className={`moderation-button ${isApprove ? "approve" : "discard"}`}
			onClick={(e) => handleClick(e)}
			aria-label={isApprove ? t("ariaLabels.approve") : t("ariaLabels.discard")}
			disabled={disabled}
		>
			{isApprove ? (
				<CheckCircle aria-hidden="true" />
			) : (
				<XmarkCircle aria-hidden="true" />
			)}
		</IconButton>
	);
};
