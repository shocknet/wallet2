import React, { createContext, useContext } from "react";
import type { SourceView } from "@/State/scoped/backups/sources/selectors";

export type SelectedAdminSourceCtx = {
	adminSource: SourceView;
};

const SelectedAdminSourceContext = createContext<SelectedAdminSourceCtx | undefined>(undefined);

export const SelectedAdminSourceProvider: React.FC<{
	children: React.ReactNode;
	value: SelectedAdminSourceCtx;
}> = ({ children, value }) => (
	<SelectedAdminSourceContext.Provider value={value}>
		{children}
	</SelectedAdminSourceContext.Provider>
);

export const useSelectedAdminSource = (): SelectedAdminSourceCtx => {
	const ctx = useContext(SelectedAdminSourceContext);
	if (!ctx) throw new Error("useSelectedAdminSource must be used inside SelectedAdminSourceProvider");
	return ctx;
};
