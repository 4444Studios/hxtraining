/**
 * Reverse geocode coordinates to "City, Region" for the contact form.
 * Uses Photon (komoot) — CORS-enabled public API.
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

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
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
