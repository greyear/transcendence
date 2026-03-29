import type { ReactNode } from "react";
import "~/assets/styles/pageHeader.css";

type PageHeaderProps = {
	title: string;
	totalLabel: string;
	action?: ReactNode;
};

export const PageHeader = ({ title, totalLabel, action }: PageHeaderProps) => {
	return (
		<div className="page-header">
			<div className="page-header__content">
				<h1 className="h2 page-header__title">{title}</h1>
				<p className="page-header__total text-label">{totalLabel}</p>
			</div>
			{action && <div className="page-header__action">{action}</div>}
		</div>
	);
};
