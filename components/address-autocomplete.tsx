"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { loadGoogleMapsAPI } from "@/lib/google-maps"

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  onError?: (error: string) => void
  onPlaceSelect?: (place: any) => void
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  id,
  onError,
  onPlaceSelect,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState(value)
  const [lastProcessedPlaceId, setLastProcessedPlaceId] = useState<string | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const onChangeRef = useRef(onChange)
  const onErrorRef = useRef(onError)
  const onPlaceSelectRef = useRef(onPlaceSelect)

  // Sync input value with external value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Update refs when props change
  useEffect(() => {
    onChangeRef.current = onChange
    onErrorRef.current = onError
    onPlaceSelectRef.current = onPlaceSelect
  }, [onChange, onError, onPlaceSelect])

  // Shared function to process place selection
  const processPlaceSelection = (place: any, source: string) => {
    console.log(`🔄 [AddressAutocomplete] Processing place selection from ${source}`)
    
    if (!place || !place.place_id) {
      console.log(`❌ [AddressAutocomplete] No valid place data from ${source}`)
      return false
    }

    // Prevent duplicate processing of the same place
    if (lastProcessedPlaceId === place.place_id) {
      console.log(`🔄 [AddressAutocomplete] Place ${place.place_id} already processed, skipping`)
      return false
    }

    console.log(`✅ [AddressAutocomplete] Processing new place from ${source}:`, place.place_id)
    console.log(`🏢 [AddressAutocomplete] Place name:`, place.name)
    console.log(`📍 [AddressAutocomplete] Place formatted_address:`, place.formatted_address)
    console.log(`🏷️ [AddressAutocomplete] Place types:`, place.types)
    
    let selectedAddress = ""

    // If it's a business/establishment, use the name + address
    if (
      place.name &&
      place.types &&
      (place.types.includes("establishment") ||
        place.types.includes("point_of_interest") ||
        place.types.includes("store") ||
        place.types.includes("restaurant") ||
        place.types.includes("lodging") ||
        place.types.includes("hospital") ||
        place.types.includes("school") ||
        place.types.includes("university"))
    ) {
      selectedAddress = `${place.name}, ${place.formatted_address}`
      console.log(`🏢 [AddressAutocomplete] Business detected - using name + address format`)
    } else {
      // For regular addresses, just use the formatted address
      selectedAddress = place.formatted_address || ""
      console.log(`🏠 [AddressAutocomplete] Regular address - using formatted_address only`)
    }

    console.log(`🎯 [AddressAutocomplete] Final selectedAddress:`, selectedAddress)

    if (selectedAddress) {
      setLastProcessedPlaceId(place.place_id)
      console.log(`📤 [AddressAutocomplete] Calling onChange with selectedAddress:`, selectedAddress)
      onChangeRef.current(selectedAddress)
      console.log(`🔄 [AddressAutocomplete] Setting inputValue to:`, selectedAddress)
      setInputValue(selectedAddress)

      // Notify parent component about the selected place
      if (onPlaceSelectRef.current) {
        console.log(`🔔 [AddressAutocomplete] Calling onPlaceSelect with place data`)
        onPlaceSelectRef.current(place)
      }
      return true
    } else {
      console.log(`❌ [AddressAutocomplete] selectedAddress is empty, not updating`)
      return false
    }
  }


  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        console.log("🚀 [AddressAutocomplete] Starting Google Maps API initialization")
        await loadGoogleMapsAPI()
        console.log("✅ [AddressAutocomplete] Google Maps API loaded successfully")

        if (inputRef.current && window.google) {
          console.log("✅ [AddressAutocomplete] Input ref and window.google available")
          console.log("🔧 [AddressAutocomplete] Creating autocomplete instance...")
          
          // Create autocomplete instance with business-focused configuration
          autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ["establishment", "geocode"], // Include businesses and addresses
            componentRestrictions: { country: ["au"] }, // Restrict to Australia only
            fields: ["formatted_address", "geometry", "name", "place_id", "types", "business_status"],
          })
          
          console.log("✅ [AddressAutocomplete] Autocomplete instance created:", autocompleteRef.current)
          console.log("🔗 [AddressAutocomplete] Adding place_changed listener...")

          // Listen for place selection
          autocompleteRef.current.addListener("place_changed", () => {
            console.log("🔥 [AddressAutocomplete] place_changed listener triggered!")
            const place = autocompleteRef.current.getPlace()
            console.log("🗺️ [AddressAutocomplete] Raw place data:", JSON.stringify(place, null, 2))
            processPlaceSelection(place, "place_changed event")
          })

          console.log("✅ [AddressAutocomplete] place_changed listener added successfully")
          
          setIsLoading(false)
          setError(null)
        } else {
          console.log("❌ [AddressAutocomplete] Missing inputRef.current or window.google")
          console.log("❌ [AddressAutocomplete] inputRef.current:", inputRef.current)
          console.log("❌ [AddressAutocomplete] window.google:", window.google)
        }
      } catch (err) {
        console.error("❌ [AddressAutocomplete] Failed to load Google Maps API:", err)
        const errorMessage = typeof err === "string" ? err : "Failed to load address suggestions"
        setError(errorMessage)
        setIsLoading(false)
        onErrorRef.current?.(errorMessage)
      }
    }

    initializeAutocomplete()

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log("🔤 [AddressAutocomplete] Input change - typed value:", newValue)
    setInputValue(newValue)
    console.log("📤 [AddressAutocomplete] Calling onChange with typed value:", newValue)
    onChange(newValue)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onClick={() => console.log("🖱️ [AddressAutocomplete] Input field clicked")}
        onFocus={() => {
          console.log("🎯 [AddressAutocomplete] Input field focused - starting place checking")
          // Start checking for place changes every 300ms when focused
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
          }
          checkIntervalRef.current = setInterval(() => {
            if (autocompleteRef.current) {
              const place = autocompleteRef.current.getPlace()
              if (place && place.place_id && place.place_id !== lastProcessedPlaceId) {
                console.log("⏰ [AddressAutocomplete] Interval check found place selection!")
                console.log("⏰ [AddressAutocomplete] Place:", place)
                processPlaceSelection(place, "interval check")
              }
            }
          }, 300)
        }}
        onBlur={(e) => {
          console.log("😵‍💫 [AddressAutocomplete] Input field blurred - stopping place checking")
          // Stop the interval checking
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
            checkIntervalRef.current = null
          }
          
          // Do one final check after blur
          setTimeout(() => {
            if (autocompleteRef.current) {
              const place = autocompleteRef.current.getPlace()
              console.log("😵‍💫 [AddressAutocomplete] Final place check on blur:", place)
              if (place && place.place_id && place.place_id !== lastProcessedPlaceId) {
                console.log("🚨 [AddressAutocomplete] Processing place selection from final blur check")
                processPlaceSelection(place, "blur check")
              }
            }
          }, 100)
        }}
        onKeyDown={(e) => {
          console.log("⌨️ [AddressAutocomplete] Key pressed:", e.key)
          if (e.key === 'Enter' || e.key === 'Tab') {
            console.log("⌨️ [AddressAutocomplete] Enter/Tab pressed - checking for place...")
            setTimeout(() => {
              if (autocompleteRef.current) {
                const place = autocompleteRef.current.getPlace()
                console.log("⌨️ [AddressAutocomplete] Place after Enter/Tab:", place)
              }
            }, 100)
          }
        }}
        onMouseDown={() => console.log("🖱️ [AddressAutocomplete] Mouse down on input")}
        onMouseUp={() => console.log("🖱️ [AddressAutocomplete] Mouse up on input")}
        placeholder={error ? "Enter address manually" : isLoading ? "Loading suggestions..." : placeholder}
        disabled={isLoading}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-red-300" : ""}`}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  )
}
