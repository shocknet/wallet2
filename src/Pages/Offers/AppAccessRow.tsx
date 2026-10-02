import { IonItem, IonLabel } from "@ionic/react";
import { useGetManageAuthorizationsQuery } from "@/State/api/api";

export const appAccessPath = (sourceId: string) => `/offers/${sourceId}/access`;

export function AppAccessRow({ sourceId }: { sourceId: string }) {
	const { approvedCount } = useGetManageAuthorizationsQuery(
		{ sourceId },
		{
			selectFromResult: ({ data }) => ({
				approvedCount: data?.filter((auth) => auth.authorized).length,
			}),
		},
	);

	return (
		<IonItem
			button
			detail
			lines="none"
			routerLink={appAccessPath(sourceId)}
			className="rounded-xl wallet-box-shadow [--background:var(--app-surface)] [--border-radius:0.75rem]"
		>
			<IonLabel className="text-sm text-primary">
				Apps that can manage your offers
			</IonLabel>
			{approvedCount !== undefined ? (
				<div slot="end" className="text-sm text-muted">
					{approvedCount}
				</div>
			) : null}
		</IonItem>
	);
}
