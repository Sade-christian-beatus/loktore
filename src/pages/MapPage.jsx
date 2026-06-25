import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchFacilities } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

// Correctif des icônes par défaut de Leaflet avec un bundler (Vite).
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const OUAGA = [12.3686, -1.5275]

export default function MapPage() {
  const { t } = useTranslation()
  const points = (useFetch(fetchFacilities).data || []).filter((p) => p.lat != null && p.lng != null)
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <h1 className="px-4 pb-2 pt-6 text-xl font-bold text-slate-800">
        {t('map.title')}
      </h1>
      <div className="flex-1">
        <MapContainer center={OUAGA} zoom={13} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                {p.address}
                {p.onDuty && (
                  <>
                    <br />
                    <span style={{ color: '#16a34a' }}>● {t('map.onDuty')}</span>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
