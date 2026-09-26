import React from "react";
import { IonApp } from "@ionic/react";
import { ShellFailureLayout } from "@/shell/screens/ShellFailureLayout";

interface ErrorBoundaryState {
	errorMSG: string | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
	state: ErrorBoundaryState = { errorMSG: null };

	static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
		return { errorMSG: String(error) };
	}

	componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
		console.log({ error, errorInfo });
	}

	render() {
		if (this.state.errorMSG === null) return this.props.children;

		return (
			<IonApp>
				<ShellFailureLayout
					title="Something went wrong"
					message="The app hit an unexpected error. Reloading usually fixes it."
					meta={
						<p className="font-mono text-xs text-faint break-words">
							{this.state.errorMSG}
						</p>
					}
					actions={[
						{
							key: "reload",
							label: "Reload app",
							primary: true,
							onClick: () => window.location.reload(),
						},
					]}
				/>
			</IonApp>
		);
	}
}

export default ErrorBoundary;
