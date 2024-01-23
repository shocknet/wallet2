declare namespace Cypress {
	interface Chainable {
		emptyDb(): Chainable
		addApp(): Chainable
		populateLocalStorage(): Chainable
		addUser(): Chainable
		payInvoice({ invoice: string }): Chainable
		getRemoteUserInvoice(): Chainable
	}
}
