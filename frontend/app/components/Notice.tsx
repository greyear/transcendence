import { useEffect } from "react";
import "~/assets/styles/notice.css";

type NoticeProps = {
	message: string | null;
	onDismiss: () => void;
	durationMs?: number;
};

/**
 * Single-slot transient notice rendered at the bottom of the viewport.
 * Auto-dismisses after `durationMs` (default 4s). New messages replace the
 * previous one, which is the desired behavior for the current caller set
 * (guest-replay "already following" / "already favorited" hints).
 */
export const Notice = ({
	message,
	onDismiss,
	durationMs = 4000,
}: NoticeProps) => {
	useEffect(() => {
		if (!message) {
			return;
		}
		const timeout = window.setTimeout(onDismiss, durationMs);
		return () => window.clearTimeout(timeout);
	}, [message, durationMs, onDismiss]);

	if (!message) {
		return null;
	}

	return (
		<output className="notice" aria-live="polite" aria-atomic="true">
			{message}
		</output>
	);
};
