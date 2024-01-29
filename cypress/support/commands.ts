import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import { NOSTR_PRIVATE_KEY_STORAGE_KEY, NOSTR_PUBLIC_KEY_STORAGE_KEY, NOSTR_RELAYS, PUB_NOSTR_PUBLIC_KEY_STORAGE_KEY } from '../../src/constants';
/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//



Cypress.Commands.add("emptyDb", () => {
	window.localStorage.clear();
	cy.request('GET', `http://localhost:18000/api/testing/db/reset`).then(res => {
		if (!res.body.auth_token) {
			throw new Error("Error resting pub test db");
		}
		window.localStorage.setItem(PUB_NOSTR_PUBLIC_KEY_STORAGE_KEY, res.body.pub_key)
		window.localStorage.setItem('authToken', res.body.auth_token);
		
	})
})

Cypress.Commands.add("payInvoice", ({ invoice }: { invoice: string }) => {
	cy.request({
		method: "POST",
		url: "http://localhost:18000/api/app/invoice/pay",
		body: {
			invoice,
			user_identifier: "mockUser",
			amount: 0
		},
		headers: {
			"Authorization": window.localStorage.getItem('authToken')
		},
	})
})

Cypress.Commands.add("populateLocalStorage", () => {
	cy.window().then(win => {

		const nprofile = nip19.nprofileEncode({ pubkey: win.localStorage.getItem(PUB_NOSTR_PUBLIC_KEY_STORAGE_KEY) as string, relays: NOSTR_RELAYS });
		const payTo = [
			{
				id: 0,
				label: "Bootstrap Node",
				pasteField: nprofile,
				option: "A little.",
				icon: "0"
			}
		];
		const spendFrom = [
			{
				id: 0,
				label: "Bootstrap Node",
				pasteField: nprofile,
				option: "A little.",
				icon: "0",
				balance: "0"
			}
		]
		const privKey = generatePrivateKey();
		const pubkKey = getPublicKey(privKey);
	
		win.localStorage.setItem(NOSTR_PRIVATE_KEY_STORAGE_KEY, privKey);
		win.localStorage.setItem(NOSTR_PUBLIC_KEY_STORAGE_KEY, pubkKey);
		win.localStorage.setItem("TEST_NPROFILE", nprofile);
		win.localStorage.setItem("spendFrom", JSON.stringify(spendFrom));
		win.localStorage.setItem("payTo", JSON.stringify(payTo));
	})
})

Cypress.Commands.add("addUser", () => {
	cy.request({
		url: "http://localhost:18000/api/app/user/add",
		method: "POST",

		headers: {
			"Authorization": window.localStorage.getItem('authToken')
		},
		body: {
			identifier: "mockUser", fail_if_exists: true, balance: 20000 // 20k
		}
	}).then(res => console.log("here is the add user res", res.body))
})

Cypress.Commands.add("getRemoteUserInvoice", () => {
	cy.request({
		url: "http://localhost:18000/api/app/user/add/invoice",
		method: "POST",
		body: {
			receiver_identifier:"mockUser",
			payer_identifier: "none",
			http_callback_url: "none",
			invoice_req: {
				amountSats: 200,
				memo: "test"
			}
		},
		headers: {
			"Authorization": window.localStorage.getItem('authToken')
		},
	}).then(res => {
		window.localStorage.setItem("invoice-to-pay", res.body.invoice)
	})
})



