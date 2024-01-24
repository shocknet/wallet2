import { nip19 } from 'nostr-tools'
import { PUB_NOSTR_PUBLIC_KEY_STORAGE_KEY } from '../../src/constants';

const initialNprofileSats = 2000;


describe("first timing", () => {
	beforeEach(() => {
		cy.emptyDb();
		cy.visit("")
	})
	it('opens to the node up page', () => {
		cy.contains("Node Up");
	})
	it("gets an nprofile in local storage when clicking continue", () => {
		cy.get("#continue-button").click();
		cy.contains("sats");
		cy.window().should(win => {
			const spendSources = JSON.parse(win.localStorage.getItem("spendFrom"));
			expect(spendSources).to.not.be.null;
			const nprofile = spendSources[0].pasteField;
			const { data } = nip19.decode(nprofile);
			const dataString = JSON.stringify(data);
			const dataBox = JSON.parse(dataString);
			expect(dataBox.pubkey).to.equal(win.localStorage.getItem(PUB_NOSTR_PUBLIC_KEY_STORAGE_KEY))

		})
	})
	it("going to send or receive pages with empty sources forces back to home page", () => {
		cy.visit("/#/send");
		cy.contains("You don't have any sources!");
		cy.url().should("include", "home");
		cy.visit("/#/receive");
		cy.contains("You don't have any sources!");
		cy.url().should("include", "home");
	})
})

describe("has nprofile and default 2000 sats", () => {
	beforeEach(() => {
		cy.emptyDb();
		cy.wait(600);
		cy.populateLocalStorage() // user starts with 2000 sats here
		cy.addUser();
		cy.visit("")
		
	})

	it("Has nprofile in sources page", () => {
		cy.visit("/#/sources");
		cy.contains("Bootstrap Node")
	})
	it("generates invoice that gets paid, balance increases", { defaultCommandTimeout: 20000 }, () => {
		const invoiceAmount = 200;
		cy.contains("Receive").click();
		cy.contains("Loading...").should("not.exist");
		cy.contains("INVOICE").click();
		cy.get("#invoice-amount").type(invoiceAmount.toString());
		cy.get("#invoice-memo").type("testing, testing, testing");
		cy.get("#confirm-invoice-amount").click();
		cy.contains("Loading...").should("not.exist");
		cy.get("#backdrop-background").should("not.exist");
		cy.get("body").focus()
		cy.get("#copy-button").should("exist");
		cy.get("#copy-button").click();
		
		cy.window().its("navigator.clipboard").invoke("readText").then(prom => {
			prom.then((text: string) => {
				cy.payInvoice({invoice: text.slice("lightning:".length)})
				cy.visit("")
				cy.get("#wallet_balance").contains((initialNprofileSats + invoiceAmount).toString());
				cy.get(".SwItem").as("history-item");
				cy.get("@history-item").contains("testing, testing, testing")
				cy.get("@history-item").contains(invoiceAmount.toString())
			})
		})
	})

	it.only("Pays invoice and gets balance substracted", () => {
		cy.getRemoteUserInvoice();
		cy.visit("/#/send");
		cy.window().then(win => {
			const invoice = win.localStorage.getItem("invoice-to-pay") as string;
			cy.get("#bitcoin-input").type(invoice)
			cy.get("#send-amount-input").should("have.value", "200");
			cy.get("#memo-input").type("testing, testing, testing");
			cy.get("#send-button").click();
			cy.url().should("include", "home");
			cy.get(".SwItem").as("history-item");
			cy.get("@history-item").contains("testing, testing, testing")
			cy.get("@history-item").contains("200")

		})

	})

	
})



