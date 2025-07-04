"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
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

  // Sync input value with external value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await loadGoogleMapsAPI()

        if (inputRef.current && window.google) {
          // Create autocomplete instance with business-focused configuration
          autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ["establishment", "geocode"], // Include businesses and addresses
            componentRestrictions: { country: ["au"] }, // Restrict to Australia only
            fields: ["formatted_address", "geometry", "name", "place_id", "types", "business_status"],
          })

          // Listen for place selection
          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current.getPlace()

            if (place) {
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
              } else {
                // For regular addresses, just use the formatted address
                selectedAddress = place.formatted_address || ""
              }

              if (selectedAddress) {
                onChange(selectedAddress)
                setInputValue(selectedAddress)

                // Notify parent component about the selected place
                if (onPlaceSelect) {
                  onPlaceSelect(place)
                }
              }
            }
          })

          setIsLoading(false)
          setError(null)
        }
      } catch (err) {
        console.error("Failed to load Google Maps API:", err)
        const errorMessage = typeof err === "string" ? err : "Failed to load address suggestions"
        setError(errorMessage)
        setIsLoading(false)
        onError?.(errorMessage)
      }
    }

    initializeAutocomplete()

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onChange, onError, onPlaceSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    // Only update parent component when user is typing manually
    // (not when selection happens via the dropdown)
    if (!autocompleteRef.current?.getPlace()) {
      onChange(newValue)
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={error ? "Enter address manually" : isLoading ? "Loading suggestions..." : placeholder}
        disabled={isLoading}
        className={error ? "border-red-300" : ""}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  )
}
