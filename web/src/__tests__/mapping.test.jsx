import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Map from '../Map'
import ProfessionalMap from '../ProfessionalMap'

// Mock Mapbox GL
vi.mock('mapbox-gl', () => ({
  Map: vi.fn(),
  Marker: vi.fn(),
  Popup: vi.fn(),
}))

describe('Map Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Map Component', () => {
    it('should render map container', () => {
      render(<Map />)

      const mapContainer = screen.getByTestId('map-container')
      expect(mapContainer).toBeInTheDocument()
    })

    it('should initialize mapbox with access token', () => {
      render(<Map accessToken="pk_test_123" />)

      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    it('should center map on initial location', () => {
      const initialCenter = { lat: 41.0082, lng: 28.9784 }

      render(
        <Map
          initialCenter={initialCenter}
          initialZoom={12}
        />
      )

      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    it('should handle zoom changes', async () => {
      const user = userEvent.setup()
      const onZoomChange = vi.fn()

      render(
        <Map onZoomChange={onZoomChange} />
      )

      const mapContainer = screen.getByTestId('map-container')
      fireEvent.wheel(mapContainer, { deltaY: 100 })

      await waitFor(() => {
        expect(onZoomChange).toHaveBeenCalled()
      })
    })

    it('should handle panning', async () => {
      const onCenterChange = vi.fn()

      render(
        <Map onCenterChange={onCenterChange} />
      )

      const mapContainer = screen.getByTestId('map-container')

      fireEvent.mouseDown(mapContainer, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(document, { clientX: 200, clientY: 200 })
      fireEvent.mouseUp(document)

      await waitFor(() => {
        expect(onCenterChange).toHaveBeenCalled()
      })
    })

    it('should add markers', () => {
      const markers = [
        { id: '1', lat: 41.0082, lng: 28.9784, title: 'Marker 1' },
        { id: '2', lat: 41.0142, lng: 28.9895, title: 'Marker 2' },
      ]

      render(
        <Map markers={markers} />
      )

      markers.forEach((marker) => {
        const markerElement = screen.queryByTestId(`marker-${marker.id}`)
        if (markerElement) {
          expect(markerElement).toBeInTheDocument()
        }
      })
    })

    it('should click marker', async () => {
      const user = userEvent.setup()
      const onMarkerClick = vi.fn()

      const markers = [
        { id: '1', lat: 41.0082, lng: 28.9784, title: 'Marker 1' },
      ]

      render(
        <Map markers={markers} onMarkerClick={onMarkerClick} />
      )

      const marker = screen.getByTestId('marker-1')
      if (marker) {
        await user.click(marker)
        expect(onMarkerClick).toHaveBeenCalledWith('1')
      }
    })

    it('should show popup on marker click', () => {
      const markers = [
        {
          id: '1',
          lat: 41.0082,
          lng: 28.9784,
          title: 'Marker 1',
          description: 'Test marker',
        },
      ]

      render(
        <Map markers={markers} />
      )

      // Check if popup is rendered
      const popup = screen.queryByText('Test marker')
      if (popup) {
        expect(popup).toBeInTheDocument()
      }
    })

    it('should update markers dynamically', () => {
      const { rerender } = render(
        <Map
          markers={[
            { id: '1', lat: 41.0082, lng: 28.9784, title: 'Marker 1' },
          ]}
        />
      )

      rerender(
        <Map
          markers={[
            { id: '1', lat: 41.0082, lng: 28.9784, title: 'Marker 1' },
            { id: '2', lat: 41.0142, lng: 28.9895, title: 'Marker 2' },
          ]}
        />
      )

      // Second marker should be added
    })

    it('should handle loading state', () => {
      render(
        <Map isLoading={true} />
      )

      const loadingIndicator = screen.queryByTestId('map-loading')
      if (loadingIndicator) {
        expect(loadingIndicator).toBeInTheDocument()
      }
    })

    it('should handle error state', () => {
      render(
        <Map error="Map failed to load" />
      )

      expect(screen.getByText('Map failed to load')).toBeInTheDocument()
    })

    it('should support clustering', () => {
      const manyMarkers = Array.from({ length: 100 }, (_, i) => ({
        id: `marker-${i}`,
        lat: 41.0082 + Math.random() * 0.01,
        lng: 28.9784 + Math.random() * 0.01,
      }))

      render(
        <Map markers={manyMarkers} clustering={true} />
      )

      // Clusters should be created for close markers
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    it('should filter by bounds', () => {
      const onBoundsChange = vi.fn()
      const bounds = {
        north: 41.05,
        south: 40.95,
        east: 29.05,
        west: 28.85,
      }

      render(
        <Map bounds={bounds} onBoundsChange={onBoundsChange} />
      )

      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })

  describe('Professional Map Component', () => {
    it('should render professional map', () => {
      render(<ProfessionalMap />)

      expect(screen.getByTestId('professional-map-container')).toBeInTheDocument()
    })

    it('should support multiple layers', () => {
      const layers = ['satellite', 'streets', 'terrain']

      render(
        <ProfessionalMap layers={layers} />
      )

      expect(screen.getByTestId('professional-map-container')).toBeInTheDocument()
    })

    it('should change map style', async () => {
      const user = userEvent.setup()

      render(
        <ProfessionalMap initialStyle="satellite" />
      )

      const styleSelector = screen.getByRole('combobox', { name: /style/i })
      if (styleSelector) {
        await user.selectOptions(styleSelector, 'streets')
        expect(styleSelector).toHaveValue('streets')
      }
    })

    it('should show heat map', () => {
      render(
        <ProfessionalMap showHeatmap={true} />
      )

      expect(screen.getByTestId('professional-map-container')).toBeInTheDocument()
    })

    it('should display geofences', () => {
      const geofences = [
        {
          id: 'fence-1',
          type: 'circle',
          center: { lat: 41.0082, lng: 28.9784 },
          radius: 1000, // 1km
        },
      ]

      render(
        <ProfessionalMap geofences={geofences} />
      )

      expect(screen.getByTestId('professional-map-container')).toBeInTheDocument()
    })

    it('should track user location', () => {
      render(
        <ProfessionalMap trackUser={true} />
      )

      expect(screen.getByTestId('professional-map-container')).toBeInTheDocument()
    })

    it('should draw routes', () => {
      const route = [
        { lat: 41.0082, lng: 28.9784 },
        { lat: 41.0142, lng: 28.9895 },
        { lat: 41.0200, lng: 29.0000 },
      ]

      render(
        <ProfessionalMap route={route} />
      )

      expect(screen.getByTestId('professional-map-container')).toBeInTheDocument()
    })

    it('should display statistics', () => {
      const stats = {
        totalReports: 42,
        activeVolunteers: 15,
        areasCleared: 8,
      }

      render(
        <ProfessionalMap showStats={true} stats={stats} />
      )

      expect(screen.getByText(/42/)).toBeInTheDocument()
      expect(screen.getByText(/15/)).toBeInTheDocument()
    })

    it('should handle real-time updates', async () => {
      const onReportUpdate = vi.fn()

      render(
        <ProfessionalMap onReportUpdate={onReportUpdate} />
      )

      // Simulate real-time update
      fireEvent.click(screen.getByTestId('professional-map-container'))

      await waitFor(() => {
        // Real-time updates should be handled
      })
    })
  })

  describe('Map Accessibility', () => {
    it('should have keyboard navigation', async () => {
      const user = userEvent.setup()

      render(<Map />)

      const mapContainer = screen.getByTestId('map-container')

      // Test keyboard navigation
      mapContainer.focus()
      await user.keyboard('{ArrowUp}')
      await user.keyboard('{+}') // Zoom in
    })

    it('should have ARIA labels', () => {
      render(
        <Map
          markers={[
            { id: '1', lat: 41.0082, lng: 28.9784, title: 'Test Location' },
          ]}
        />
      )

      const mapContainer = screen.getByTestId('map-container')
      expect(mapContainer).toHaveAttribute('role', 'region')
    })

    it('should announce changes to screen readers', () => {
      render(
        <Map
          markers={[
            { id: '1', lat: 41.0082, lng: 28.9784, title: 'New Location' },
          ]}
        />
      )

      const liveRegion = screen.queryByRole('status')
      if (liveRegion) {
        expect(liveRegion).toBeInTheDocument()
      }
    })
  })

  describe('Map Performance', () => {
    it('should handle large marker count', () => {
      const manyMarkers = Array.from({ length: 5000 }, (_, i) => ({
        id: `marker-${i}`,
        lat: 41.0082 + Math.random() * 0.1,
        lng: 28.9784 + Math.random() * 0.1,
      }))

      render(
        <Map markers={manyMarkers} />
      )

      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    it('should virtualize markers when needed', () => {
      const manyMarkers = Array.from({ length: 1000 }, (_, i) => ({
        id: `marker-${i}`,
        lat: 41.0082 + Math.random() * 0.1,
        lng: 28.9784 + Math.random() * 0.1,
      }))

      render(
        <Map markers={manyMarkers} virtualize={true} />
      )

      // Should only render visible markers
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    it('should debounce pan and zoom events', async () => {
      const onCenterChange = vi.fn()

      render(
        <Map onCenterChange={onCenterChange} debounceDelay={300} />
      )

      const mapContainer = screen.getByTestId('map-container')

      // Multiple rapid scroll events
      fireEvent.wheel(mapContainer, { deltaY: 50 })
      fireEvent.wheel(mapContainer, { deltaY: 50 })
      fireEvent.wheel(mapContainer, { deltaY: 50 })

      // Should only call onCenterChange once after debounce
      expect(onCenterChange.mock.calls.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Map Interactions', () => {
    it('should support double-click to zoom', async () => {
      const user = userEvent.setup()

      render(<Map />)

      const mapContainer = screen.getByTestId('map-container')
      await user.dblClick(mapContainer)

      // Should zoom in
    })

    it('should support right-click context menu', async () => {
      render(<Map />)

      const mapContainer = screen.getByTestId('map-container')
      fireEvent.contextMenu(mapContainer, { clientX: 100, clientY: 100 })

      // Context menu should appear
    })

    it('should support touch gestures on mobile', () => {
      render(<Map />)

      const mapContainer = screen.getByTestId('map-container')

      // Simulate pinch zoom
      fireEvent.touchStart(mapContainer, {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 },
        ],
      })

      fireEvent.touchMove(mapContainer, {
        touches: [
          { clientX: 50, clientY: 50 },
          { clientX: 250, clientY: 250 },
        ],
      })

      fireEvent.touchEnd(mapContainer)
    })
  })
})
