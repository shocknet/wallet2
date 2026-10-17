class QueueNode<V> {
	public value: V
	public next: QueueNode<V> | null = null
	public prev: QueueNode<V> | null = null

	constructor(message: V) {
		this.value = message
	}
}

export class Queue<V> {
	public first: QueueNode<V> | null
	public last: QueueNode<V> | null

	constructor() {
		this.first = null
		this.last = null
	}

	enqueue(value: V): boolean {
		const newNode = new QueueNode(value)
		if (!this.last) {
			// list is empty
			this.first = newNode
			this.last = newNode
		} else if (this.last === this.first) {
			// list has a single element
			this.last = newNode
			this.last.prev = this.first
			this.first.next = newNode
		} else {
			// list has elements, add as last
			newNode.prev = this.last
			this.last.next = newNode
			this.last = newNode
		}
		return true
	}

	dequeue(): V | null {
		if (!this.first) return null

		if (this.first === this.last) {
			const target = this.first
			this.first = null
			this.last = null
			return target.value
		}

		const target = this.first
		this.first = target.next
		if (this.first) {
			this.first.prev = null // fix: clean up prev pointer
		}

		return target.value
	}
}
