import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import { publishNodeBeacon } from "./remoteBackups";
import { newNip78Event, publishNostrEvent, pubServiceTag } from "../Api/nostrHandler";

vi.mock("nostr-tools", async (importOriginal) => {
    const actual = await importOriginal<typeof import("nostr-tools")>();
    return {
        ...actual,
        finalizeEvent: vi.fn((event) => ({
            ...event,
            id: "signed-id",
            sig: "signed-sig",
        })),
    };
});

vi.mock("../Api/nostrHandler", () => ({
    getNip78Event: vi.fn(),
    pubServiceTag: "Lightning.Pub",
    newNip78Event: vi.fn((data: string, pubkey: string, dTag: string) => ({
        content: data,
        created_at: 321,
        kind: 30078,
        tags: [["d", dTag]],
        pubkey,
    })),
    publishNostrEvent: vi.fn().mockResolvedValue(undefined),
}));

const newNip78EventMock = vi.mocked(newNip78Event);
const publishNostrEventMock = vi.mocked(publishNostrEvent);

describe("publishNodeBeacon", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("publishes a signed beacon event with the trimmed node name", async () => {
        const privateKey = "1".padStart(64, "0");
        const publicKey = getPublicKey(hexToBytes(privateKey));

        const createdAtUnix = await publishNodeBeacon({
            pubkey: publicKey,
            relays: ["wss://relay.example"],
            keys: { privateKey, publicKey },
            name: "  Nodey McNodeFace  ",
        });

        expect(createdAtUnix).toBe(321);
        expect(newNip78EventMock).toHaveBeenCalledWith(
            JSON.stringify({ type: "service", name: "Nodey McNodeFace" }),
            publicKey,
            pubServiceTag
        );
        expect(publishNostrEventMock).toHaveBeenCalledTimes(1);
        expect(publishNostrEventMock).toHaveBeenCalledWith(
            expect.objectContaining({
                content: JSON.stringify({ type: "service", name: "Nodey McNodeFace" }),
                created_at: 321,
                kind: 30078,
                pubkey: publicKey,
                tags: [["d", pubServiceTag]],
                sig: expect.any(String),
            }),
            ["wss://relay.example"]
        );
    });

    it("rejects an empty node name before trying to publish", async () => {
        const privateKey = "1".padStart(64, "0");
        const publicKey = getPublicKey(hexToBytes(privateKey));

        await expect(
            publishNodeBeacon({
                pubkey: publicKey,
                relays: ["wss://relay.example"],
                keys: { privateKey, publicKey },
                name: "   ",
            })
        ).rejects.toThrow("Node name cannot be empty");

        expect(newNip78EventMock).not.toHaveBeenCalled();
        expect(publishNostrEventMock).not.toHaveBeenCalled();
    });
});
