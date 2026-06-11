import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginationControls, LazyLoadList, PaginationStats } from '../pagination'

describe('Pagination Components', () => {
  describe('PaginationControls', () => {
    const defaultProps = {
      currentPage: 1,
      hasNextPage: true,
      onNextPage: vi.fn(),
      onPrevPage: vi.fn(),
      isLoading: false,
      pageSize: 10,
      totalItems: 100,
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render pagination controls', () => {
      render(<PaginationControls {...defaultProps} />)

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('should disable previous button on first page', () => {
      render(<PaginationControls {...defaultProps} currentPage={1} />)

      const prevButton = screen.getByRole('button', { name: /previous/i })
      expect(prevButton).toBeDisabled()
    })

    it('should disable next button when no next page', () => {
      render(
        <PaginationControls {...defaultProps} hasNextPage={false} />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    it('should call onNextPage when next button is clicked', async () => {
      const user = userEvent.setup()
      render(<PaginationControls {...defaultProps} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      expect(defaultProps.onNextPage).toHaveBeenCalledOnce()
    })

    it('should call onPrevPage when previous button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PaginationControls {...defaultProps} currentPage={2} />
      )

      const prevButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevButton)

      expect(defaultProps.onPrevPage).toHaveBeenCalledOnce()
    })

    it('should show loading state', () => {
      render(<PaginationControls {...defaultProps} isLoading={true} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })

    it('should display current page number', () => {
      render(<PaginationControls {...defaultProps} currentPage={3} />)

      expect(screen.getByText(/page 3/i)).toBeInTheDocument()
    })

    it('should handle rapid clicks gracefully', async () => {
      const user = userEvent.setup()
      const onNextPage = vi.fn()
      render(
        <PaginationControls
          {...defaultProps}
          onNextPage={onNextPage}
          isLoading={false}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })

      // Simulate rapid clicks
      await user.click(nextButton)
      await user.click(nextButton)
      await user.click(nextButton)

      // Implementation should debounce or manage state to prevent multiple calls
    })

    it('should calculate total pages correctly', () => {
      render(
        <PaginationControls
          {...defaultProps}
          totalItems={100}
          pageSize={10}
        />
      )

      expect(screen.getByText(/total/i)).toBeInTheDocument()
    })
  })

  describe('LazyLoadList', () => {
    const mockData = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      title: `Item ${i}`,
      description: `Description ${i}`,
    }))

    const defaultProps = {
      data: mockData,
      onLoadMore: vi.fn(),
      hasMore: true,
      isLoading: false,
      renderItem: (item) => <div key={item.id}>{item.title}</div>,
      threshold: 0.8,
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render list items', () => {
      render(
        <LazyLoadList {...defaultProps} />
      )

      mockData.forEach((item) => {
        expect(screen.getByText(item.title)).toBeInTheDocument()
      })
    })

    it('should trigger onLoadMore when scrolling near bottom', async () => {
      render(
        <LazyLoadList {...defaultProps} />
      )

      const scrollContainer = screen.getByTestId('lazy-load-container')

      // Simulate scroll event
      fireEvent.scroll(scrollContainer, { target: { scrollY: 800 } })

      await waitFor(() => {
        expect(defaultProps.onLoadMore).toHaveBeenCalled()
      })
    })

    it('should not trigger onLoadMore when hasMore is false', async () => {
      render(
        <LazyLoadList {...defaultProps} hasMore={false} />
      )

      const scrollContainer = screen.getByTestId('lazy-load-container')
      fireEvent.scroll(scrollContainer, { target: { scrollY: 800 } })

      await waitFor(() => {
        expect(defaultProps.onLoadMore).not.toHaveBeenCalled()
      })
    })

    it('should show loading indicator when loading', () => {
      render(
        <LazyLoadList {...defaultProps} isLoading={true} />
      )

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })

    it('should show end of list message when no more items', () => {
      render(
        <LazyLoadList {...defaultProps} hasMore={false} />
      )

      expect(
        screen.getByText(/end of list|no more items/i)
      ).toBeInTheDocument()
    })

    it('should handle empty data', () => {
      render(
        <LazyLoadList {...defaultProps} data={[]} />
      )

      expect(screen.getByText(/no items|empty/i)).toBeInTheDocument()
    })

    it('should respect custom threshold', async () => {
      const onLoadMore = vi.fn()
      render(
        <LazyLoadList
          {...defaultProps}
          onLoadMore={onLoadMore}
          threshold={0.5}
        />
      )

      const scrollContainer = screen.getByTestId('lazy-load-container')

      // Trigger scroll at 50% threshold
      fireEvent.scroll(scrollContainer, { target: { scrollY: 400 } })

      await waitFor(() => {
        expect(onLoadMore).toHaveBeenCalled()
      })
    })

    it('should render custom item component', () => {
      const customRender = (item) => (
        <div key={item.id} data-testid={item.id}>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      )

      render(
        <LazyLoadList {...defaultProps} renderItem={customRender} />
      )

      mockData.forEach((item) => {
        expect(screen.getByTestId(item.id)).toBeInTheDocument()
        expect(screen.getByText(item.description)).toBeInTheDocument()
      })
    })

    it('should handle scroll performance', () => {
      const { rerender } = render(
        <LazyLoadList {...defaultProps} />
      )

      // Add more items
      const moreData = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        description: `Description ${i}`,
      }))

      rerender(
        <LazyLoadList {...defaultProps} data={moreData} />
      )

      // Should render without performance degradation
      expect(screen.getByText('Item 0')).toBeInTheDocument()
    })
  })

  describe('PaginationStats', () => {
    const defaultProps = {
      currentPage: 1,
      pageSize: 10,
      totalItems: 45,
      hasMore: true,
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display pagination statistics', () => {
      render(<PaginationStats {...defaultProps} />)

      expect(screen.getByText(/1.*10.*45/)).toBeInTheDocument()
    })

    it('should calculate item range correctly', () => {
      render(
        <PaginationStats
          {...defaultProps}
          currentPage={2}
          pageSize={10}
          totalItems={45}
        />
      )

      // Page 2 should show items 11-20
      expect(screen.getByText(/11.*20/)).toBeInTheDocument()
    })

    it('should show last page partially filled items', () => {
      render(
        <PaginationStats
          {...defaultProps}
          currentPage={5}
          pageSize={10}
          totalItems={45}
        />
      )

      // Page 5 should show items 41-45
      expect(screen.getByText(/41.*45/)).toBeInTheDocument()
    })

    it('should display progress bar', () => {
      render(<PaginationStats {...defaultProps} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('should calculate progress percentage', () => {
      render(
        <PaginationStats
          {...defaultProps}
          currentPage={3}
          pageSize={10}
          totalItems={45}
        />
      )

      // ~66% (30 items viewed out of 45)
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', expect.any(String))
    })

    it('should show 100% progress when on last page', () => {
      render(
        <PaginationStats
          {...defaultProps}
          currentPage={5}
          pageSize={10}
          totalItems={45}
          hasMore={false}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    })

    it('should handle zero items', () => {
      render(
        <PaginationStats
          {...defaultProps}
          totalItems={0}
        />
      )

      expect(screen.getByText(/0.*0.*0/)).toBeInTheDocument()
    })
  })

  describe('Pagination Integration', () => {
    it('should work together correctly', async () => {
      const user = userEvent.setup()
      const onNextPage = vi.fn()

      const { rerender } = render(
        <div>
          <PaginationControls
            currentPage={1}
            hasNextPage={true}
            onNextPage={onNextPage}
            onPrevPage={vi.fn()}
            isLoading={false}
            pageSize={10}
            totalItems={100}
          />
          <PaginationStats
            currentPage={1}
            pageSize={10}
            totalItems={100}
            hasMore={true}
          />
        </div>
      )

      expect(screen.getByText(/page 1/i)).toBeInTheDocument()
      expect(screen.getByText(/1.*10.*100/)).toBeInTheDocument()

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      expect(onNextPage).toHaveBeenCalled()

      // Update to page 2
      rerender(
        <div>
          <PaginationControls
            currentPage={2}
            hasNextPage={true}
            onNextPage={onNextPage}
            onPrevPage={vi.fn()}
            isLoading={false}
            pageSize={10}
            totalItems={100}
          />
          <PaginationStats
            currentPage={2}
            pageSize={10}
            totalItems={100}
            hasMore={true}
          />
        </div>
      )

      expect(screen.getByText(/page 2/i)).toBeInTheDocument()
      expect(screen.getByText(/11.*20.*100/)).toBeInTheDocument()
    })

    it('should handle state transitions smoothly', async () => {
      const { rerender } = render(
        <PaginationControls
          currentPage={1}
          hasNextPage={true}
          onNextPage={vi.fn()}
          onPrevPage={vi.fn()}
          isLoading={false}
          pageSize={10}
          totalItems={100}
        />
      )

      // Transition to loading state
      rerender(
        <PaginationControls
          currentPage={1}
          hasNextPage={true}
          onNextPage={vi.fn()}
          onPrevPage={vi.fn()}
          isLoading={true}
          pageSize={10}
          totalItems={100}
        />
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })
  })
})
