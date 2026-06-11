import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_CONFIG, hasMapboxToken } from './mapbox-config'

export default function Map({ reports = [], groups = [] }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [mapError, setMapError] = useState(null)

  useEffect(() => {
    if (!hasMapboxToken() || !mapContainerRef.current) return

    try {
      mapboxgl.accessToken = MAPBOX_CONFIG.mapboxToken

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_CONFIG.mapStyle,
        center: MAPBOX_CONFIG.defaultCenter,
        zoom: MAPBOX_CONFIG.defaultZoom
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right')

      mapRef.current = map

      return () => {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
      }
    } catch (err) {
      console.error('Map initialization error:', err)
      setMapError(err.message)
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !hasMapboxToken()) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add report markers
    reports.forEach(report => {
      if (report.location?.lat && report.location?.lng) {
        const el = document.createElement('div')
        el.className = 'map-marker report-marker'
        el.style.cssText = `
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #ef4444;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        `

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding:8px;">
              <h4 style="margin:0 0 4px;font-size:14px;font-weight:600;">
                ${report.category || 'Rapor'}
              </h4>
              <p style="margin:0;font-size:12px;color:#666;">
                ${report.description?.substring(0, 100) || 'Açıklama yok'}
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#999;">
                ${new Date(report.timestamp?.toDate?.() || report.timestamp).toLocaleString('tr-TR')}
              </p>
            </div>
          `)

        const marker = new mapboxgl.Marker(el)
          .setLngLat([report.location.lng, report.location.lat])
          .setPopup(popup)
          .addTo(mapRef.current)

        markersRef.current.push(marker)
      }
    })

    // Add group markers
    groups.forEach(group => {
      if (group.location?.lat && group.location?.lng) {
        const el = document.createElement('div')
        el.className = 'map-marker group-marker'
        el.style.cssText = `
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${group.status === 'active' ? '#10b981' : '#6b7280'};
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        `
        el.textContent = group.members?.length || 0

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding:8px;">
              <h4 style="margin:0 0 4px;font-size:14px;font-weight:600;">
                ${group.name}
              </h4>
              <p style="margin:0;font-size:12px;color:#666;">
                ${group.members?.length || 0} gönüllü
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#999;">
                Durum: ${group.status === 'active' ? 'Aktif' : 'Beklemede'}
              </p>
            </div>
          `)

        const marker = new mapboxgl.Marker(el)
          .setLngLat([group.location.lng, group.location.lat])
          .setPopup(popup)
          .addTo(mapRef.current)

        markersRef.current.push(marker)
      }
    })

    // Fit bounds if we have markers
    if (markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getLngLat())
      })
      mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 14 })
    }
  }, [reports, groups])

  if (!hasMapboxToken()) {
    return (
      <div style={{
        height: 240,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#777',
        background: '#f5f5f5',
        borderRadius: 8
      }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🗺️</div>
          <div>Mapbox token bulunamadı</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            .env.local dosyasına VITE_MAPBOX_TOKEN ekleyin
          </div>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div style={{
        height: 240,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ef4444',
        background: '#fef2f2',
        borderRadius: 8
      }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
          <div>Harita yüklenirken hata</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{mapError}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapContainerRef} style={{ height: 240, borderRadius: 8, overflow: 'hidden' }} />
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'white',
        padding: '8px 12px',
        borderRadius: 6,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        fontSize: 12,
        display: 'flex',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
          <span>Raporlar ({reports.length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
          <span>Gruplar ({groups.length})</span>
        </div>
      </div>
    </div>
  )
}
