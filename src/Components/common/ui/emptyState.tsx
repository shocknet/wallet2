import { IonIcon, IonText } from "@ionic/react";
import { documentTextOutline } from "ionicons/icons";
import cn from "clsx";

interface EmptyStateProps {
	message?: string;
	title?: string;
	description?: string;
	ionicon?: string;
	hideIcon?: boolean;
	variant?: "page" | "section";
	className?: string;
}

const EmptyState = ({
	message,
	title,
	description,
	ionicon,
	hideIcon = false,
	variant = "page",
	className,
}: EmptyStateProps) => {
	const heading = title ?? message;
	const isSection = variant === "section";

	return (
		<div
			className={cn(
				"flex w-full flex-col items-center justify-center text-center",
				isSection ? "px-2 py-8" : "h-full px-4 py-10",
				className,
			)}
		>
			{!hideIcon ? (
				<IonIcon
					icon={ionicon || documentTextOutline}
					className={cn(
						"text-faint",
						isSection ? "text-[2.25rem]" : "text-[3.5rem]",
					)}
					aria-hidden
				/>
			) : null}

			{heading ? (
				<IonText>
					<p
						className={cn(
							"m-0 max-w-[18rem] font-medium text-secondary",
							hideIcon ? "" : isSection ? "mt-2.5" : "mt-3",
							isSection ? "text-sm leading-5" : "text-base leading-6",
						)}
					>
						{heading}
					</p>
				</IonText>
			) : null}

			{description ? (
				<p
					className={cn(
						"m-0 mt-1.5 max-w-[18rem] text-muted",
						isSection ? "text-xs leading-4" : "text-sm leading-5",
					)}
				>
					{description}
				</p>
			) : null}
		</div>
	);
};

export default EmptyState;
