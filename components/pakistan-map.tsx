'use client'

import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Use local GeoJSON to prevent CORS issues during PDF generation
const GEO_URL = '/countries-110m.json'

// Major Pakistani cities with coordinates
const PAKISTAN_CITIES = [
  { name: 'Karachi', coordinates: [67.0099, 24.8607] as [number, number], size: 12 },
  { name: 'Lahore', coordinates: [74.3587, 31.5204] as [number, number], size: 10 },
  { name: 'Islamabad', coordinates: [73.0479, 33.6844] as [number, number], size: 8 },
  { name: 'Rawalpindi', coordinates: [73.0479, 33.5651] as [number, number], size: 7 },
  { name: 'Faisalabad', coordinates: [73.0651, 31.4504] as [number, number], size: 8 },
  { name: 'Multan', coordinates: [71.4736, 30.1575] as [number, number], size: 7 },
  { name: 'Peshawar', coordinates: [71.5249, 34.0151] as [number, number], size: 7 },
  { name: 'Quetta', coordinates: [67.0099, 30.1798] as [number, number], size: 6 },
  { name: 'Sialkot', coordinates: [74.5229, 32.4945] as [number, number], size: 5 },
  { name: 'Hyderabad', coordinates: [68.3578, 25.3960] as [number, number], size: 5 },
]

interface PakistanMapProps {
  highlightCity?: string
  cityScores?: Record<string, number>
  title?: string
}

function getMarkerColor(city: string, highlightCity?: string, cityScores?: Record<string, number>) {
  if (highlightCity && city === highlightCity) return '#01796F'
  if (cityScores && cityScores[city] !== undefined) {
    const score = cityScores[city]
    if (score >= 75) return '#01796F'
    if (score >= 50) return '#3b82f6'
    return '#ef4444'
  }
  return '#6b7280'
}

export function PakistanMap({ highlightCity, cityScores, title }: PakistanMapProps) {
  return (
    <TooltipProvider>
      <div className="w-full rounded-xl border border-border bg-card overflow-hidden">
        {title && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
          </div>
        )}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [69, 30], scale: 1800 }}
          width={500}
          height={380}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup zoom={1} center={[69, 30]} minZoom={0.8} maxZoom={4}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => geo.properties.name === 'Pakistan')
                  .map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#f3f4f6"
                      stroke="#e5e7eb"
                      strokeWidth={0.8}
                      style={{
                        default: { outline: 'none' },
                        hover: { fill: '#e5e7eb', outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
              }
            </Geographies>

            {PAKISTAN_CITIES.map(({ name, coordinates, size }) => {
              const color = getMarkerColor(name, highlightCity, cityScores)
              const isHighlighted = name === highlightCity
              const score = cityScores?.[name]

              return (
                <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <Marker coordinates={coordinates}>
                      {isHighlighted && (
                        <circle r={size + 6} fill={color} opacity={0.2} />
                      )}
                      <circle
                        r={isHighlighted ? size + 2 : size - 2}
                        fill={color}
                        stroke="white"
                        strokeWidth={1.5}
                        style={{ cursor: 'pointer' }}
                      />
                      <text
                        textAnchor="middle"
                        y={-(isHighlighted ? size + 4 : size)}
                        style={{
                          fontSize: isHighlighted ? '7px' : '6px',
                          fill: isHighlighted ? '#1f2937' : '#4b5563',
                          fontWeight: isHighlighted ? 700 : 500,
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {name}
                      </text>
                    </Marker>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">{name}</p>
                    {score !== undefined && <p>Market score: {score}/100</p>}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Legend */}
        {cityScores && (
          <div className="flex flex-wrap gap-3 px-4 pb-4 pt-1">
            {[['High (75+)', '#01796F'], ['Medium (50–74)', '#3b82f6'], ['Low (<50)', '#ef4444']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full" style={{ background: color as string }} />
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
