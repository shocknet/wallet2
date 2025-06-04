import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SourceActualOperation, SourceOptimsticOperation, type HistoryState } from './types';
import { fetchHistoryForSource, processNewIncomingOperation, sendPaymentThunk } from './thunks';


const initialState: HistoryState = {
	sources: {},
	newPaymentsCount: 0,
	status: 'idle',
	error: null
};

const emptyCursor = {
	latestIncomingInvoice: 0,
	latestIncomingTx: 0,
	latestIncomingUserToUserPayment: 0,
	latestOutgoingInvoice: 0,
	latestOutgoingTx: 0,
	latestOutgoingUserToUserPayment: 0,
	max_size: 100
}

const paymentHistorySlice = createSlice({
	name: 'paymentHistory',
	initialState,
	reducers: {
		addNewOperation: (
			state,
			action: PayloadAction<{ sourceId: string; operation: SourceActualOperation }>
		) => {
			const { sourceId, operation } = action.payload;
			if (!state.sources[sourceId]) {
				state.sources[sourceId] = { data: [], cursor: emptyCursor };
			}

			const existingOps = state.sources[sourceId].data;
			const index = existingOps.findIndex(op => op.operationId === operation.operationId);
			if (index === -1) {
				existingOps.push(operation);
			} else {
				existingOps[index] = operation;
			}
			state.newPaymentsCount += 1;
		},
		updateOptimsticOperation: (
			state,
			action: PayloadAction<{ sourceId: string; operation: SourceOptimsticOperation, oldOperationId: string }>
		) => {
			const { sourceId, operation, oldOperationId } = action.payload;
			if (!state.sources[sourceId]) {
				return;
			}

			const existingOps = state.sources[sourceId].data;
			const index = existingOps.findIndex(op => op.operationId === oldOperationId && op.optimistic);
			if (index !== -1) {
				existingOps[index] = operation;
			}
		},
		addOptimisticOperation: (
			state,
			action: PayloadAction<{
				sourceId: string;
				operation: SourceOptimsticOperation;
			}>
		) => {
			const { sourceId, operation } = action.payload;
			if (!state.sources[sourceId]) {
				state.sources[sourceId] = { data: [], cursor: emptyCursor };
			}
			// Only add if it doesn't exist
			const existing = state.sources[sourceId].data.filter(op => op.optimistic).findIndex(
				(op) => op.operationId === operation.operationId
			);
			if (existing === -1) {
				state.sources[sourceId].data.push(operation);
			}
		},
		removeOptimisticOperation: (
			state,
			action: PayloadAction<{ sourceId: string; operationId: string }>
		) => {
			const { sourceId, operationId } = action.payload;
			if (!state.sources[sourceId]) {
				return;
			}
			state.sources[sourceId].data = state.sources[sourceId].data.filter(
				(op) => (op.operationId !== operationId)
			);
		},
		updateOperationNote: (
			state,
			action: PayloadAction<{ sourceId: string; operationId: string, note: string }>
		) => {
			const { sourceId, operationId, note } = action.payload;
			if (!state.sources[sourceId]) {
				return;
			}
			const existingOps = state.sources[sourceId].data;
			const index = existingOps.findIndex(op => op.operationId === operationId);
			if (index !== -1) {
				existingOps[index].memo = note;
			}
		},
		resetCursors: (
			state,
			action: PayloadAction<void>
		) => {
			for (const sourceId in state.sources) {
				state.sources[sourceId].cursor = emptyCursor;
			}

		}
	},
	extraReducers: (builder) => {
		// fetch sources from pub
		builder
			.addCase(fetchHistoryForSource.pending, (state) => {
				state.status = 'loading';
			})
			.addCase(fetchHistoryForSource.fulfilled, (state, action) => {
				state.status = 'idle';
				const { sourceId, newOps, newCursor } = action.payload;
				if (!state.sources[sourceId]) {
					state.sources[sourceId] = { data: [], cursor: emptyCursor };
				}
				const existing = state.sources[sourceId].data;

				// We'll track how many truly NEW ops we add for UX purposes
				let newlyAddedCount = 0;

				for (const newOp of newOps) {
					// Find if there's an existing op with the same ID
					const idx = existing.findIndex(op => op.operationId === newOp.operationId);
					if (idx !== -1) {
						// Replace it (in case we have updated info like fees or statuses)
						existing[idx] = newOp;
					} else {
						// Not found => this is a brand new transaction to us
						existing.push(newOp);
						newlyAddedCount++;
					}
				}
				state.sources[sourceId].cursor = newCursor;
				if (newlyAddedCount > 0) {
					state.newPaymentsCount += newlyAddedCount;
				}

			})
			.addCase(fetchHistoryForSource.rejected, (state, action) => {
				state.status = 'error';
				state.error = action.error.message || 'Failed to fetch history';
			});

		// 3) Send Payment
		builder
			.addCase(sendPaymentThunk.pending, (state) => {
				state.status = 'loading';
			})
			.addCase(sendPaymentThunk.fulfilled, (state, _action) => {
				state.status = 'idle';
				// We let the fetchHistoryForSource handle final merges
			})
			.addCase(sendPaymentThunk.rejected, (state, action) => {
				state.status = 'error';
				state.error = action.error.message || 'Failed to send payment';
			});

		builder
			.addCase(processNewIncomingOperation.fulfilled, (state, action) => {
				const { sourceId, operation } = action.payload;
				if (!state.sources[sourceId]) {
					state.sources[sourceId] = { data: [], cursor: emptyCursor };
				}
				const existingOps = state.sources[sourceId].data;
				const index = existingOps.findIndex(op => op.operationId === operation.operationId);
				if (index === -1) {
					existingOps.push(operation);
				} else {
					existingOps[index] = operation;
				}
			})


	}
})

export const { addNewOperation,
	addOptimisticOperation,
	removeOptimisticOperation,
	updateOptimsticOperation,
	updateOperationNote,
	resetCursors,
} = paymentHistorySlice.actions;

export default paymentHistorySlice.reducer;



