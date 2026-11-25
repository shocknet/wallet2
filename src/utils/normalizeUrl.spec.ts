import { describe, expect, it } from "vitest";
import { normalizeUrl } from "./normalizeUrl";

type Options = Parameters<typeof normalizeUrl>[1];
type Scheme = Options["defaultScheme"];
type Case = readonly [input: string, expected: string];

const HTTP = {
	defaultScheme: "https",
	allowedSchemes: ["http", "https"],
} as const satisfies Options;

const WS = {
	defaultScheme: "wss",
	allowedSchemes: ["ws", "wss"],
} as const satisfies Options;

const schemes = ["http", "https", "ws", "wss"] as const;
const defaultPorts: Record<Scheme, number> = {
	http: 80,
	https: 443,
	ws: 80,
	wss: 443,
};

function optionsFor(scheme: Scheme): Options {
	return { defaultScheme: scheme, allowedSchemes: [scheme] };
}


function expectNormalized(input: string, expected: string, options: Options) {
	const actual = normalizeUrl(input, options);
	expect(actual, `normalizing ${JSON.stringify(input)}`).toBe(expected);
	expect(normalizeUrl(actual, options), `idempotence of ${actual}`).toBe(actual);
	const parsed = new URL(actual);
	expect(parsed.href).toBe(actual);
	expect(options.allowedSchemes.some(s => parsed.protocol === `${s}:`)).toBe(true);
	expect(parsed.username).toBe("");
	expect(parsed.password).toBe("");
	expect(parsed.hash).toBe("");
}


const hostCases: readonly Case[] = [
	["localhost", "localhost/"],
	["localhost:8080", "localhost:8080/"],
	["github.com", "github.com/"],
	["GITHUB.COM", "github.com/"],
	["api.github.com", "api.github.com/"],
	["www.github.com", "www.github.com/"],
	["github.co.uk", "github.co.uk/"],
	["github.com.", "github.com/"],
	["github.com..", "github.com/"],
	["bücher.de", "xn--bcher-kva.de/"],
	["xn--bcher-kva.de", "xn--bcher-kva.de/"],
	["127.0.0.1", "127.0.0.1/"],
	["192.168.1.10:8080", "192.168.1.10:8080/"],
	["10.0.0.1", "10.0.0.1/"],
	["0.0.0.0", "0.0.0.0/"],
	["127.1", "127.0.0.1/"],
	["0x7f000001", "127.0.0.1/"],
	["2130706433", "127.0.0.1/"],
	["[::1]", "[::1]/"],
	["[::1]:8080", "[::1]:8080/"],
	["[2001:0DB8:0:0:0:0:0:1]", "[2001:db8::1]/"],
	["[::ffff:192.0.2.1]", "[::ffff:c000:201]/"],
];

const pathCases: readonly Case[] = [
	["", "/"],
	["/", "/"],
	["//", "/"],
	["///", "/"],
	["/relay", "/relay"],
	["/relay/", "/relay"],
	["/relay//", "/relay"],
	["/a//b///", "/a/b"],
	["//a//b//", "/a/b"],
	["/A/b", "/A/b"],
	["/Relay", "/Relay"],
	["/RELAY///", "/RELAY"],
	["/A//B/", "/A/B"],
	["/index.html", "/index.html"],
	["/relay/index.php", "/relay/index.php"],
	["/a/./b", "/a/b"],
	["/a/../b/", "/b"],
	["/a/..", "/"],
	["/../../relay", "/relay"],
	["/a/%2e%2e/b", "/b"],
	["/a/%2E/b", "/a/b"],
	["/%7euser", "/~user"],
	["/%41", "/A"],
	["/a%2fb", "/a%2Fb"],
	["/a%3fb%23c", "/a%3Fb%23c"],
	["/a%5cb", "/a%5Cb"],
	["/100%25", "/100%25"],
	["/%252e%252e/etc", "/%252e%252e/etc"],
	["/a%09b", "/a%09b"],
	["/a b", "/a%20b"],
	["/pa\tth", "/path"],
	["/\u0000path", "/%00path"],
	["/\u007fpath", "/%7Fpath"],
	["/café", "/caf%C3%A9"],
	["/a\\b", "/a/b"],
	["/https://github.com/a//b", "/https://github.com/a/b"],
];

const queryCases: readonly Case[] = [
	["?", "/"],
	["?&&", "/"],
	["?z=3&a=1&b=2", "/?a=1&b=2&z=3"],
	["?b=2&a=1&b=1", "/?a=1&b=2&b=1"],
	["?a=1&a=1", "/?a=1&a=1"],
	["?b=2&B=1", "/?B=1&b=2"],
	["?flag", "/?flag="],
	["?flag=", "/?flag="],
	["?b&a=", "/?a=&b="],
	["?a=1&a", "/?a=1&a="],
	["?a&&b=2&", "/?a=&b=2"],
	["?=value", "/?=value"],
	["?=", "/?="],
	["?b=2&utm_source=foo&a=1", "/?a=1&b=2&utm_source=foo"],
	["?UTM_medium=x&fbclid=y&gclid=z", "/?UTM_medium=x&fbclid=y&gclid=z"],
	["?%61=1&a=2", "/?a=1&a=2"],
	["?q=hello%20world", "/?q=hello+world"],
	["?q=hello+world", "/?q=hello+world"],
	["?foo+bar=baz", "/?foo%20bar=baz"],
	["?z=~&a=%20&flag", "/?a=+&flag=&z=~"],
	["?x=%2b&y=+", "/?x=%2B&y=+"],
	["?x=a%26b%3dc", "/?x=a%26b%3Dc"],
	["?x=%2f", "/?x=%2F"],
	["?x=/", "/?x=/"],
	["?x=a%23b", "/?x=a%23b"],
	["?x=100%25", "/?x=100%25"],
	["?key=a=b=c", "/?key=a=b=c"],
	["?key=abc==", "/?key=abc=="],
	["?key=val%3due", "/?key=val%3Due"],
];

const fragmentCases: readonly Case[] = [
	["#", "/"],
	["#section", "/"],
	["/#section", "/"],
	["/relay#section", "/relay"],
	["/relay/#section", "/relay"],
	["/RELAY///#section", "/RELAY"],
	["/Relay/?Token=AbC123#section", "/Relay?Token=AbC123"],
	["/A//B/?token=ABC&Token=XYZ#section", "/A/B?Token=XYZ&token=ABC"],
	["/relay?b=2&a=1#section", "/relay?a=1&b=2"],
	["/#:~:text=hello", "/"],
	["/a%23b#fragment", "/a%23b"],
];

describe("normalizeUrl", () => {
	describe.each(schemes)("%s normalization", scheme => {
		const options = optionsFor(scheme);
		const prefix = `${scheme}://`;
		const port = defaultPorts[scheme];

		describe("scheme and input handling", () => {
			it.each([
				"github.com",
				"  github.com  ",
				"\t\ngithub.com\r\n",
				`\u00a0github.com\u00a0`,
				`${scheme}://github.com`,
				`${scheme.toUpperCase()}://GITHUB.COM`,
				`${scheme}:github.com`,
				`${scheme}:/github.com`,
				`${scheme}:///github.com`,
				`${scheme}://git\nhub.com`,
				`git\thub.com`,
				`//github.com`,
				`///github.com`,
			])("normalizes %j", input => {
				expectNormalized(input, `${prefix}github.com/`, options);
			});

			it("allows the parser to repair a numeric hostname after a known scheme", () => {
				expectNormalized(`${scheme}:80`, `${prefix}0.0.0.80/`, options);
			});

			it("recognizes a host and port followed by path, query and fragment", () => {
				expectNormalized("github.com:8443/relay?z=2&a=1#x",
					`${prefix}github.com:8443/relay?a=1&z=2`, options);
			});
		});

		describe("host validation", () => {
			it.each(hostCases)("canonicalizes %j", (input, expected) => {
				expectNormalized(input, prefix + expected, options);
			});

			it.each([
				"api.localhost",
				"server.internal", "printer.local", "something.test",
				"github.invalid", "example.com", "example.net.", "api.example.org",
				"home.arpa", "foo.onion", "foo.alt", "com", "co.uk",
			])("rejects non-public or special-use domain %j", input => {
				expect(() => normalizeUrl(input, options)).toThrow("Invalid or unsupported domain");
			});

			it.each([
				"256.256.256.256", "999.1.1.1", "4294967296",
				"[::invalid]", "[::1", "[1::2::3]", "[fe80::1%25eth0]",
				"git hub.com", "github%00.com", "github.com%2fpath",
			])("rejects malformed host %j", input => {
				expect(() => normalizeUrl(input, options)).toThrow("Invalid URL");
			});
		});

		describe("ports", () => {
			it.each([
				[`github.com:${port}`, "github.com/"],
				[`${prefix}github.com:${port}`, "github.com/"],
				[`github.com:000${port}`, "github.com/"],
				[`github.com:${port}/relay?x=1`, "github.com/relay?x=1"],
				[`${prefix}github.com:`, "github.com/"],
				["github.com:0", "github.com:0/"],
				["github.com:65535", "github.com:65535/"],
				["github.com:8443", "github.com:8443/"],
				["github.com:0008443", "github.com:8443/"],
				[`github.com:${port === 80 ? 443 : 80}`, `github.com:${port === 80 ? 443 : 80}/`],
			])("canonicalizes %j", (input, expected) => {
				expectNormalized(input, prefix + expected, options);
			});

			it.each(["65536", "70000", "-1", "+80", "abc", "80abc", "80.5"])(
				"rejects explicit invalid port %j", value => {
					expect(() => normalizeUrl(`${prefix}github.com:${value}`, options)).toThrow("Invalid URL");
				},
			);
		});

		describe("credentials", () => {
			it.each([
				"alice@", "alice:secret@", ":secret@", "alice:@",
				"alice%40mail.com@", "%61lice:%73ecret@", "alice:secret%40@",
			])("rejects nonempty userinfo %j", credentials => {
				expect(() => normalizeUrl(`${prefix}${credentials}github.com`, options))
					.toThrow("URL credentials are not allowed");
			});

			it("rejects scheme-less username", () => {
				expect(() => normalizeUrl("alice@github.com", options))
					.toThrow("URL credentials are not allowed");
			});

			// URL discards empty userinfo; the wrapper only rejects nonempty credentials.
			it.each(["@", ":@"])("accepts empty userinfo %j", credentials => {
				expectNormalized(`${prefix}${credentials}github.com`, `${prefix}github.com/`, options);
			});
		});

		it.each(pathCases)("canonicalizes path %j", (input, expected) => {
			expectNormalized(`github.com${input}`, `${prefix}github.com${expected}`, options);
		});

		it.each(queryCases)("canonicalizes query %j", (input, expected) => {
			expectNormalized(`github.com${input}`, `${prefix}github.com${expected}`, options);
		});

		it.each(fragmentCases)("canonicalizes fragment %j", (input, expected) => {
			expectNormalized(`github.com${input}`, `${prefix}github.com${expected}`, options);
		});
	});

	describe("allowed schemes", () => {

		describe.each(schemes)("only %s allowed", allowed => {
			it.each(schemes)("handles explicit %s", supplied => {
				const input = `${supplied}://github.com`;
				const options = optionsFor(allowed);
				if (supplied === allowed) {
					expectNormalized(input, `${supplied}://github.com/`, options);
				} else {
					expect(() => normalizeUrl(input, options)).toThrow(`Expected one of: ${allowed}`);
				}
			});
		});

		it.each(["http", "https"] as const)("HTTP family preserves %s", scheme => {
			expectNormalized(`${scheme}://github.com`, `${scheme}://github.com/`, HTTP);
			expect(() => normalizeUrl(`${scheme}://github.com`, WS)).toThrow("Expected one of: ws, wss");
		});
		it.each(["ws", "wss"] as const)("WebSocket family preserves %s", scheme => {
			expectNormalized(`${scheme}://github.com`, `${scheme}://github.com/`, WS);
			expect(() => normalizeUrl(`${scheme}://github.com`, HTTP)).toThrow("Expected one of: http, https");
		});

		it.each([
			"ftp://github.com", "file:///tmp/file", "mailto:user@github.com",
			"data:text/plain,hello", "javascript:alert(1)", "custom:github.com",
			"github.com://github.com", "ssh://github.com", "blob:https://github.com/id",
		])("rejects unsupported scheme in %j", input => {
			expect(() => normalizeUrl(input, HTTP)).toThrow("Expected one of: http, https");
			expect(() => normalizeUrl(input, WS)).toThrow("Expected one of: ws, wss");
		});

		it("does not rewrite a disallowed malformed explicit scheme to the default", () => {
			expect(() => normalizeUrl("http:/github.com", WS)).toThrow("Expected one of: ws, wss");
			expect(() => normalizeUrl("wss:/github.com", HTTP)).toThrow("Expected one of: http, https");
		});

		it("rejects all inputs when the allowlist is empty", () => {
			expect(() => normalizeUrl("github.com", { defaultScheme: "https", allowedSchemes: [] }))
				.toThrow("Expected one of:");
		});

		it("checks the resolved protocol even when the default is not allowed", () => {
			const options: Options = { defaultScheme: "https", allowedSchemes: ["http"] };
			expect(() => normalizeUrl("github.com", options)).toThrow("Expected one of: http");
			expectNormalized("http://github.com", "http://github.com/", options);
		});
	});

	describe("invalid inputs", () => {
		it.each(["", " ", "\t\r\n", "\u00a0", "/github.com", "./github.com", "../github.com",
			"https://", "wss://", "https://alice:secret@", "https://?q=1", "https://#x",
			"github.com:70000", "github.com:abc", "github.com:80abc", "?q=1", "#fragment",
		])("rejects %j", input => {
			// A malformed scheme-less port can also be read as an unsupported scheme.
			expect(() => normalizeUrl(input, HTTP)).toThrow();
			expect(() => normalizeUrl(input, WS)).toThrow();
		});
	});

	describe("endpoint identity", () => {
		it.each([
			"WSS://GITHUB.COM:443/relay?b=2&a=1#fragment",
			"wss://github.com/relay?a=1&b=2",
			"github.com:443/relay?b=2&a=1",
			"github.com./relay?a=1&b=2",
			"//github.com/relay?b=2&a=1",
			"github.com//relay?b=2&a=1",
			"github.com/relay/?b=2&a=1",
			"github.com//relay///?a=1&b=2",
		])("converges equivalent relay representation %j", input => {
			expectNormalized(input, "wss://github.com/relay?a=1&b=2", WS);
		});

		it.each([
			["github.com", "github.com/"],
			["github.com/a//b", "github.com/a/b"],
			["github.com/relay//", "github.com/relay/"],
			["github.com/relay", "github.com/relay/"],
			["github.com/A/B", "github.com/A//B///"],
			["github.com/Relay?Token=AbC123", "github.com/Relay/?Token=AbC123"],
			["github.com/%7euser", "github.com/~user"],
			["github.com?a=1&b=2", "github.com?b=2&a=1"],
			["github.com?flag", "github.com?flag="],
			["github.com?q=hello%20world", "github.com?q=hello+world"],
		])("intentionally collapses %j and %j", (a, b) => {
			const left = normalizeUrl(a, WS);
			const right = normalizeUrl(b, WS);
			expect(left).toBe(right);
			expectNormalized(a, left, WS);
			expectNormalized(b, left, WS);
		});

		it.each([
			["ws://github.com", "wss://github.com"],
			["github.com", "www.github.com"],
			["github.com", "api.github.com"],
			["github.com", "github.com:8443"],
			["github.com/relay", "github.com/Relay"],
			["github.com/relay/", "github.com/Relay/"],
			["github.com/a/B", "github.com/A/b"],
			["github.com/%41", "github.com/a"],
			["github.com/relay?Token=ABC", "github.com/relay?token=ABC"],
			["github.com/relay?token=ABC", "github.com/relay?token=abc"],
			["github.com/relay/", "github.com/relay/index.html"],
			["github.com/a/b", "github.com/a%2Fb"],
			["github.com?a=1", "github.com?a=2"],
			["github.com?a=1", "github.com?a=1&a=1"],
			["github.com?a=1&a=2", "github.com?a=2&a=1"],
			["github.com?q=%2B", "github.com?q=+"],
			["github.com?q=%2F", "github.com?q=/"],
			["github.com", "github.com?utm_source=foo"],
		])("keeps distinct endpoints separate: %j vs %j", (a, b) => {
			const left = normalizeUrl(a, WS);
			const right = normalizeUrl(b, WS);
			expect(left).not.toBe(right);
			expectNormalized(a, left, WS);
			expectNormalized(b, right, WS);
		});
	});

	describe("combined transformations", () => {
		it.each(schemes)("is canonical and idempotent across combined %s inputs", scheme => {
			const options = optionsFor(scheme);
			const hosts: readonly Case[] = [
				["GITHUB.COM.", "github.com"],
				["www.github.com", "www.github.com"],
				["bücher.de", "xn--bcher-kva.de"],
				["[2001:0DB8::1]", "[2001:db8::1]"],
			];
			const ports: readonly Case[] = [
				["", ""], [`:${defaultPorts[scheme]}`, ""],
				[":08443", ":8443"], [":65535", ":65535"],
			];
			const paths: readonly Case[] = [
				["", "/"], ["/Relay/", "/Relay"],
				["/A//B/../C///", "/A/C"], ["/a%2fb", "/a%2Fb"],
			];
			const suffixes: readonly Case[] = [
				["", ""], ["#section", ""],
				["?b=2&A=AbC#x", "?A=AbC&b=2"],
				["?flag&b=2&b=1", "?b=2&b=1&flag="],
			];
			for (const [host, expectedHost] of hosts) {
				for (const [port, expectedPort] of ports) {
					for (const [path, expectedPath] of paths) {
						for (const [suffix, expectedSuffix] of suffixes) {
							const input = `${scheme.toUpperCase()}://${host}${port}${path}${suffix}`;
							const expected = `${scheme}://${expectedHost}${expectedPort}${expectedPath}${expectedSuffix}`;
							expectNormalized(input, expected, options);
						}
					}
				}
			}
		});
	});
});
