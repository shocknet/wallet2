import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

import { useEventCallback } from './useEventCallback'
import React from 'react'

describe('useEventCallback()', () => {
	it('should not call the callback during render', () => {
		const fn = vi.fn()
		const { result } = renderHook(() => useEventCallback(fn))

		render(<button onClick={result.current}>Click me</button>)

		expect(fn).not.toHaveBeenCalled()
	})

	it('should call the callback when the event is triggered', () => {
		const fn = vi.fn()
		const { result } = renderHook(() => useEventCallback(fn))

		render(<button onClick={result.current}>Click me</button>)

		fireEvent.click(screen.getByText('Click me'))

		expect(fn).toHaveBeenCalled()
	})


	it('should allow to pass optional callback without errors', () => {
		const optionalFn = undefined as
			| ((event: React.MouseEvent<HTMLButtonElement>) => void)
			| undefined

		const { result } = renderHook(() => useEventCallback(optionalFn))

		render(<button onClick={result.current}>Click me</button>)

		fireEvent.click(screen.getByText('Click me'))
	})
})
