/// <reference types="@testing-library/jest-dom" />
import { forwardRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Satoshi } from "@/lib/types/units";
import { AmountField } from "./AmountField";

vi.mock("@/State/store/hooks", () => ({
	useAppSelector: () => "USD",
}));

vi.mock("@/State/scoped/backups/identity/slice", () => ({
	selectFiatCurrency: vi.fn(),
}));

vi.mock("@/Components/FiatDisplay", () => ({
	getFiatString: vi.fn(async (sats: Satoshi | null) =>
		sats ? `FIAT(${sats})` : "",
	),
}));

vi.mock("@ionic/react", () => {
	const IonInput = forwardRef<
		HTMLInputElement,
		{
			value?: string | null;
			disabled?: boolean;
			helperText?: string;
			errorText?: string;
			onIonInput?: (event: {
				detail: { value: string };
			}) => void;
			onIonBlur?: () => void;
			children?: React.ReactNode;
			className?: string;
			label?: string;
			placeholder?: string;
			"data-testid"?: string;
		}
	>(function MockIonInput(
		{
			value,
			disabled,
			helperText,
			errorText,
			onIonInput,
			onIonBlur,
			children,
			className,
			label,
			placeholder,
			"data-testid": testId,
		},
		ref,
	) {
		return (
			<div className={className} data-testid={testId}>
				<label>
					{label}
					<input
						ref={ref}
						aria-label={label}
						value={value ?? ""}
						disabled={disabled}
						placeholder={placeholder}
						onBlur={onIonBlur}
						onChange={(event) =>
							onIonInput?.({ detail: { value: event.target.value } })
						}
					/>
				</label>
				{helperText ? <span data-testid="helper-text">{helperText}</span> : null}
				{errorText ? <span data-testid="error-text">{errorText}</span> : null}
				<div data-testid="end-slots">{children}</div>
			</div>
		);
	});

	function IonButton({
		children,
		onClick,
		disabled,
		...rest
	}: {
		children?: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
		"aria-label"?: string;
		"data-testid"?: string;
	}) {
		return (
			<button
				type="button"
				onClick={onClick}
				disabled={disabled}
				aria-label={rest["aria-label"]}
				data-testid={rest["data-testid"]}
			>
				{children}
			</button>
		);
	}

	return { IonInput, IonButton };
});

const sats = (n: number) => n as Satoshi;

describe("AmountField", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("types an amount and reports sats via onChange", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<AmountField onChange={onChange} />);

		await user.type(screen.getByLabelText("Amount"), "1234");

		expect(screen.getByLabelText("Amount")).toHaveValue("1,234");
		await waitFor(() => {
			expect(onChange).toHaveBeenLastCalledWith({
				sats: 1234,
				error: undefined,
			});
		});
	});

	it("seeds from initialSats on mount without locking", async () => {
		const onChange = vi.fn();
		render(
			<AmountField initialSats={sats(10)} onChange={onChange} />,
		);

		expect(screen.getByLabelText("Amount")).toHaveValue("10");
		expect(screen.getByLabelText("Amount")).not.toBeDisabled();
		await waitFor(() => {
			expect(onChange).toHaveBeenLastCalledWith({
				sats: 10,
				error: undefined,
			});
		});
	});

	it("toggles unit when allowed", async () => {
		const user = userEvent.setup();
		render(<AmountField />);

		await user.type(screen.getByLabelText("Amount"), "100000000");
		await user.click(screen.getByTestId("amount-field-unit-toggle"));

		expect(screen.getByTestId("amount-field-unit-toggle")).toHaveTextContent(
			"BTC",
		);
		expect(screen.getByLabelText("Amount")).toHaveValue("1.00000000");
	});

	it("shows a static unit label when toggle is disabled", () => {
		render(<AmountField allowUnitToggle={false} />);
		expect(screen.getByTestId("amount-field-unit-label")).toHaveTextContent(
			"SATS",
		);
		expect(
			screen.queryByTestId("amount-field-unit-toggle"),
		).not.toBeInTheDocument();
	});

	it("shows Max only with limits and applies max", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const { rerender } = render(<AmountField onChange={onChange} />);
		expect(screen.queryByTestId("amount-field-max")).not.toBeInTheDocument();

		rerender(
			<AmountField
				onChange={onChange}
				limits={{ min: sats(1), max: sats(5_000) }}
			/>,
		);
		await user.click(screen.getByTestId("amount-field-max"));
		expect(screen.getByLabelText("Amount")).toHaveValue("5,000");
		await waitFor(() => {
			expect(onChange).toHaveBeenLastCalledWith({
				sats: 5_000,
				error: undefined,
			});
		});
	});

	it("locks when fixedSats is set and unlocks when cleared", async () => {
		const onChange = vi.fn();
		const { rerender } = render(
			<AmountField onChange={onChange} fixedSats={sats(42)} />,
		);

		await waitFor(() => {
			expect(screen.getByLabelText("Amount")).toBeDisabled();
			expect(screen.getByLabelText("Amount")).toHaveValue("42");
		});

		rerender(<AmountField onChange={onChange} fixedSats={null} />);

		await waitFor(() => {
			expect(screen.getByLabelText("Amount")).not.toBeDisabled();
			expect(screen.getByLabelText("Amount")).toHaveValue("");
		});
	});

	it("updates locked amount when fixedSats changes", async () => {
		const { rerender } = render(<AmountField fixedSats={sats(10)} />);
		await waitFor(() => {
			expect(screen.getByLabelText("Amount")).toHaveValue("10");
		});

		rerender(<AmountField fixedSats={sats(99)} />);
		await waitFor(() => {
			expect(screen.getByLabelText("Amount")).toHaveValue("99");
		});
	});

	it("surfaces limit errors", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<AmountField
				onChange={onChange}
				limits={{ min: sats(100), max: sats(200) }}
			/>,
		);
		await user.type(screen.getByLabelText("Amount"), "50");
		expect(screen.getByTestId("error-text")).toHaveTextContent(
			/Minimum amount is 100/,
		);
		await waitFor(() => {
			expect(onChange).toHaveBeenLastCalledWith({
				sats: null,
				error: expect.stringMatching(/Minimum amount is 100/),
			});
		});
	});

	it("syncs tighter limits without clearing typed value", async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<AmountField limits={{ min: sats(1), max: sats(100) }} />,
		);
		await user.type(screen.getByLabelText("Amount"), "80");
		expect(screen.getByLabelText("Amount")).toHaveValue("80");

		rerender(<AmountField limits={{ min: sats(1), max: sats(50) }} />);
		expect(screen.getByLabelText("Amount")).toHaveValue("80");
		expect(screen.getByTestId("error-text")).toHaveTextContent(
			/Maximum amount is 50/,
		);
	});

	it("can hide fiat helper", async () => {
		const user = userEvent.setup();
		render(<AmountField showFiat={false} />);
		await user.type(screen.getByLabelText("Amount"), "10");
		expect(screen.queryByTestId("helper-text")).not.toBeInTheDocument();
	});

	it("supports a parent holding sats from onChange", async () => {
		const user = userEvent.setup();

		function SendLike() {
			const [satsValue, setSatsValue] = useState<Satoshi | null>(null);
			const [fixed, setFixed] = useState<Satoshi | null>(null);
			return (
				<>
					<span data-testid="parent-sats">{satsValue ?? "none"}</span>
					<button type="button" onClick={() => setFixed(sats(500))}>
						parse-invoice
					</button>
					<button type="button" onClick={() => setFixed(null)}>
						clear-recipient
					</button>
					<AmountField
						limits={{ min: sats(1), max: sats(10_000) }}
						fixedSats={fixed}
						onChange={({ sats: next }) => setSatsValue(next)}
					/>
				</>
			);
		}

		render(<SendLike />);
		await user.type(screen.getByLabelText("Amount"), "250");
		await waitFor(() => {
			expect(screen.getByTestId("parent-sats")).toHaveTextContent("250");
		});

		await user.click(screen.getByText("parse-invoice"));
		await waitFor(() => {
			expect(screen.getByLabelText("Amount")).toBeDisabled();
			expect(screen.getByTestId("parent-sats")).toHaveTextContent("500");
		});

		await user.click(screen.getByText("clear-recipient"));
		await waitFor(() => {
			expect(screen.getByLabelText("Amount")).not.toBeDisabled();
			expect(screen.getByTestId("parent-sats")).toHaveTextContent("none");
		});
	});
});
