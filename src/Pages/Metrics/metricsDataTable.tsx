import { IonText } from "@ionic/react";
import type { CSSProperties, ReactNode } from "react";

export function formatTableTs(unix: number): string {
    if (!unix) return "—";
    return new Date(unix * 1000).toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function formatTableAmount(n: number): string {
    return n.toLocaleString("fr-FR");
}

const TABLE_SHELL: CSSProperties = {
    borderRadius: "10px",
    border: "1px solid var(--dash-border, var(--ion-border-color))",
    overflow: "hidden",
    background: "var(--dash-surface, var(--ion-card-background))",
};

const TABLE_HEADER: CSSProperties = {
    display: "grid",
    gap: "6px",
    padding: "10px 12px",
    fontSize: "10px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontFamily: "var(--dash-font-mono, monospace)",
    color: "var(--dash-dim, var(--ion-color-medium))",
    borderBottom: "1px solid var(--dash-border, var(--ion-border-color))",
};

const TABLE_ROW_BASE: CSSProperties = {
    display: "grid",
    gap: "6px",
    padding: "10px 12px",
    alignItems: "center",
    fontSize: "0.85rem",
    color: "var(--ion-text-color)",
};

const TABLE_ROW_BORDER = "1px solid rgba(var(--ion-color-medium-rgb), 0.1)";

export function MetricsTableEmpty({ message }: { message: string }) {
    return (
        <IonText color="medium" style={{ display: "block", textAlign: "center", padding: "24px" }}>
            {message}
        </IonText>
    );
}

export function MetricsDataTable({
    grid,
    minWidth = "480px",
    header,
    children,
}: {
    grid: string;
    minWidth?: string;
    header: ReactNode;
    children: ReactNode;
}) {
    return (
        <div style={{ overflowX: "auto" }}>
            <div style={{ ...TABLE_SHELL, minWidth }}>
                <div style={{ ...TABLE_HEADER, gridTemplateColumns: grid }}>{header}</div>
                {children}
            </div>
        </div>
    );
}

export function MetricsTableRow({
    grid,
    isLast,
    onClick,
    children,
}: {
    grid: string;
    isLast: boolean;
    onClick?: () => void;
    children: ReactNode;
}) {
    return (
        <div
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={
                onClick
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onClick();
                          }
                      }
                    : undefined
            }
            style={{
                ...TABLE_ROW_BASE,
                gridTemplateColumns: grid,
                borderBottom: isLast ? undefined : TABLE_ROW_BORDER,
                cursor: onClick ? "pointer" : undefined,
            }}
        >
            {children}
        </div>
    );
}
