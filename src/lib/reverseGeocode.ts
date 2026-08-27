/**
 * Reverse geocode coordinates to "City, Region" for the contact form.
 * Primary: Photon (komoot) — CORS-enabled public API.
 * Fallback: OSM Nominatim — requires User-Agent per usage policy.
 */

interface PhotonProperties {
  name?: string
  city?: string
  locality?: string
  district?: string
  county?: string
  state?: string
  country?: string
}

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  hamlet?: string
  municipality?: string
  county?: string
  state?: string
  country?: string
}

function formatPlaceLine(place?: string, region?: string): string {
  const line = [place, region].filter(Boolean).join(', ')
  if (!line) throw new Error('Could not resolve city')
  return line
}

function placeFromPhotonProps(props: PhotonProperties): string | undefined {
  return (
    props.city ||
    props.locality ||
    props.name ||
    props.district ||
    props.county
  )
}

async function reverseGeocodePhoton(lat: number, lon: number): Promise<string> {
  const url = new URL('https://photon.komoot.io/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Photon HTTP ${res.status}`)

  const data = (await res.json()) as {
    features?: { properties?: PhotonProperties }[]
  }
  const props = data.features?.[0]?.properties
  if (!props) throw new Error('Photon returned no features')

  const place = placeFromPhotonProps(props)
  const region = props.state || props.country
  return formatPlaceLine(place, region)
}

async function reverseGeocodeNominatim(lat: number, lon: number): Promise<string> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  url.searchParams.set('format', 'json')
  url.searchParams.set('zoom', '10')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'HxTraining-Website/1.0 (contact form location)',
    },
  })
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)

  const data = (await res.json()) as { address?: NominatimAddress }
  const a = data.address
  if (!a) throw new Error('Nominatim returned no address')

  const place =
    a.city || a.town || a.village || a.hamlet || a.municipality || a.county
  const region = a.state || a.country
  return formatPlaceLine(place, region)
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    return await reverseGeocodePhoton(lat, lon)
  } catch (photonError) {
    console.warn('Photon reverse geocode failed, trying Nominatim:', photonError)
    return reverseGeocodeNominatim(lat, lon)
  }
}
