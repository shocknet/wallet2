import FullSpinner from "@/Components/common/ui/fullSpinner";
import { Suspense } from "react";
import { Route, Redirect, RouteProps, RouteComponentProps } from "react-router-dom";


type FC<P = any> = React.FC<P>;
type LazyFC = React.LazyExoticComponent<FC<RouteComponentProps>>;

export type GuardResult = {
	allow: boolean;
	redirectTo?: { pathname: string; state?: any };
	keySuffix?: string;
};


export type Guard = (ctx: { props: RouteComponentProps }) => GuardResult;



type Props = RouteProps & {
	component: FC<RouteComponentProps> | LazyFC;
	layout?: FC<{ children: JSX.Element }>;
	guards?: Guard[];
	pageKeyBase?: string;
};



export function GuardedRoute({
	component: Comp,
	guards = [],
	pageKeyBase: _,
	layout: Layout,
	...rest
}: Props) {
	return (
		<Route
			{...rest}
			render={(props) => {
				let redirect: GuardResult["redirectTo"] | undefined;
				const suffixes: string[] = [];

				for (const g of guards) {


					const res = g({ props });
					if (!res.allow) {
						redirect = res.redirectTo ?? { pathname: "/" };
						break;
					}
					if (res.keySuffix) suffixes.push(res.keySuffix);
				}

				if (redirect) {
					return <Redirect to={{ ...redirect, state: { ...(redirect.state ?? {}), from: props.location } }} />;
				}


				//const key = `${pageKeyBase}-${suffixes.join("|") || "ok"}`;
				const PageEl = Comp as any;
				const page = <PageEl {...props} />;
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

