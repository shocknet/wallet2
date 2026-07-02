import { IonText } from "@ionic/react";
import type { CSSProperties, ReactNode } from "react";

export function formatTableTs(unix: number): string {
    if (!unix) return "—";
    const d = new Date(unix * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = String(d.getFullYear()).slice(-2);
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function formatTableAmount(n: number): string {
    return n.toLocaleString("fr-FR");
}

const TABLE_SHELL: CSSProperties = {
    borderRadius: "8px",
    border: "1px solid var(--ion-color-medium-tint)",
    overflow: "hidden",
};

const TABLE_HEADER: CSSProperties = {
    display: "grid",
    gap: "6px",
    padding: "10px 12px",
    fontSize: "0.75rem",
    color: "var(--ion-color-medium)",
    borderBottom: "1px solid var(--ion-color-medium-tint)",
};

const TABLE_ROW_BASE: CSSProperties = {
    display: "grid",
    gap: "6px",
    padding: "10px 12px",
    alignItems: "center",
    fontSize: "0.85rem",
};

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
                borderBottom: isLast ? undefined : "1px solid var(--ion-color-medium-tint)",
                cursor: onClick ? "pointer" : undefined,
            }}
        >
            {children}
        </div>
    );
}
