import { useState, useMemo, /* useRef, */ forwardRef, useImperativeHandle, useCallback } from "react";
/* import { motion, AnimatePresence } from "framer-motion"; */





interface Props {
	children: React.ReactElement<TabProps>[];
	tabsIndicatorStyles?: React.CSSProperties;
	noDrag?: boolean;
	short?: boolean
}
export const Tabs = forwardRef<any, Props>(
	({ children: unfilteredChildren }, ref) => {
		const [tab, setTab] = useState(0);
		//const [direction, setDirection] = useState(1);

		const children = useMemo(() => {
			return unfilteredChildren.filter(c => !c.props.hide)
		}, [unfilteredChildren])



		const handleTabChange = useCallback((left: boolean) => {
			console.log("called")
			let newTabIndex = 0
			if (left) {
				newTabIndex = (tab + 1) % children.length;
			} else {
				newTabIndex = (tab - 1 + children.length) % children.length;
			}
			console.log({newTabIndex})

			//setDirection(left ? 1 : -1);
			setTab(newTabIndex);
		}, [children, tab]);

		useImperativeHandle(ref, () => {
			return {
				tab,
				handleTabChange,
			}
		});

/* 
		const swipeConfidenceThreshold = 10000;
		const swipePower = (offset: number, velocity: number) => {
			return Math.abs(offset) * velocity;
		};

		const tabWidth = useMemo(() => 100 / (children.length || 1), [children]);
		const leftPosition = useMemo(() => tab * tabWidth, [tab, tabWidth]);

		const tabsRef = useRef<HTMLDivElement>(null);
		let isDown = false;
		let startX: number;
		let scrollLeft: number;

		if (children.length === 0) {
			return null
		}

		const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
			isDown = true;
			tabsRef.current!.style.cursor = 'grabbing';
			startX = e.pageX - e.currentTarget.offsetLeft;
			scrollLeft = e.currentTarget.scrollLeft;
		}

		const handleMouseLeave = () => {
			isDown = false;
			tabsRef.current!.style.cursor = 'grab';
		}

		const handleMouseUp = () => {
			isDown = false;
			tabsRef.current!.style.cursor = 'grab';
		}

		const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
			if (!isDown) return;
			e.preventDefault();
			const x = e.pageX - e.currentTarget.offsetLeft;
			const walk = x - startX;
			e.currentTarget.scrollLeft = scrollLeft - walk;
		} */


		return (
			<>
				{children[tab]?.props.children}
			</>
/* 				<AnimatePresence>
					<motion.div
						style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
						key={tab}

						initial="initial"
						animate="in"
						exit="out"
						variants={{
							initial: (direction) => ({
								opacity: 0,
								x: direction === 1 ? 1000 : -1000,
							}),
							in: {
								opacity: 1,
								x: 0,
							},
							out: (direction) => ({
								transition: {
									type: "inertia",
									stiffness: 300,
									damping: 30
								},
								x: direction === 1 ? -1000 : 1000
							})
						}}
						
					>
						
					</motion.div>

				</AnimatePresence> */
		)
	})
Tabs.displayName = "Tabs";

interface TabProps {
	title?: string;
	jsx?: React.ReactNode;
	children: React.ReactNode;
	hide?: boolean
}

export const Tab = ({ children }: TabProps) => {
	return <>{children}</>;
};

