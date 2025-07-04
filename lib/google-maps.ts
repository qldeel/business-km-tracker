declare global {
  interface Window {
    google: any
    initMap: () => void
    gm_authFailure: () => void
  }
}

let isLoaded = false
let isLoading = false
const callbacks: (() => void)[] = []
const errorCallbacks: ((error: string) => void)[] = []

export const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // ---------- NEW: detect existing load ----------
    if (typeof window !== "undefined") {
      if (window.google?.maps) {
        isLoaded = true
        return resolve()
      }
      const existing = document.getElementById("google-maps-js") as HTMLScriptElement | null
      if (existing) {
        // If the script tag exists but is still loading,
        // queue the callback instead of injecting again.
        callbacks.push(resolve)
        errorCallbacks.push(reject)
        return
      }
    }
    // ------------------------------------------------
    if (isLoaded) {
      resolve()
      return
    }

    callbacks.push(resolve)
    errorCallbacks.push(reject)

    if (isLoading) {
      return
    }

    isLoading = true

    // Handle authentication failures
    window.gm_authFailure = () => {
      const currentDomain = window.location.origin
      let error = "Google Maps API authentication failed."

      // Check for specific error types
      if (window.location.href.includes("ApiTargetBlockedMapError")) {
        error =
          "ApiTargetBlockedMapError: Your API key has incorrect API restrictions. Please configure API restrictions to allow Maps JavaScript API, Places API, and Distance Matrix API."
      } else {
        error = `Google Maps API domain error. Add "${currentDomain}/*" to your API key restrictions in Google Cloud Console.`
      }

      isLoading = false
      errorCallbacks.forEach((callback) => callback(error))
      errorCallbacks.length = 0
      callbacks.length = 0
    }

    // Create callback function
    window.initMap = () => {
      isLoaded = true
      isLoading = false
      callbacks.forEach((callback) => callback())
      callbacks.length = 0
      errorCallbacks.length = 0
    }

    // Load Google Maps API with only required libraries
    const script = document.createElement("script")
    script.id = "google-maps-js" // <-- NEW id
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`
    script.async = true
    script.defer = true

    script.onerror = (event) => {
      isLoading = false
      let error = "Failed to load Google Maps API script."

      // Try to detect the specific error type
      const errorUrl = (event as any)?.target?.src || ""
      if (errorUrl.includes("ApiTargetBlockedMapError")) {
        error = "ApiTargetBlockedMapError: Your API key has incorrect API restrictions configured."
      }

      errorCallbacks.forEach((callback) => callback(error))
      errorCallbacks.length = 0
      callbacks.length = 0
    }

    document.head.appendChild(script)
  })
}

export const calculateRealDistance = async (
  origin: string,
  destination: string,
): Promise<{ distance: number; duration: string }> => {
  if (!window.google) {
    throw new Error("Google Maps API not loaded")
  }

  return new Promise((resolve, reject) => {
    const service = new window.google.maps.DistanceMatrixService()

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      },
      (response: any, status: any) => {
        if (status === "OK" && response.rows[0].elements[0].status === "OK") {
          const element = response.rows[0].elements[0]
          const distanceInKm = element.distance.value / 1000 // Convert meters to kilometers
          const duration = element.duration.text

          resolve({
            distance: Math.round(distanceInKm * 10) / 10, // Round to 1 decimal place
            duration,
          })
        } else {
          reject(new Error("Could not calculate distance"))
        }
      },
    )
  })
}
