import FullSpinner from "@/Components/common/ui/fullSpinner";
import { Suspense } from "react";
import { Route, type RouteComponentProps, type RouteProps } from "react-router-dom";

type Page = React.ComponentType<RouteComponentProps> | React.LazyExoticComponent<React.ComponentType<RouteComponentProps>>;

type Props = RouteProps & {
	component: Page;
	layout?: React.FC<{ children: JSX.Element }>;
};

export function AppRoute({
	component: Comp,
	layout: Layout,
	...rest
}: Props) {
	return (
		<Route
			{...rest}
			render={(props) => {
				const page = <Comp {...props} />;
				const content = Layout ? <Layout>{page}</Layout> : page;
				return (
					<Suspense fallback={<FullSpinner />}>
						{content}
					</Suspense>
				);
			}}
		/>
	);
}
