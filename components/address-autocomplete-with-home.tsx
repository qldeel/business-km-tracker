"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"

interface AddressAutocompleteWithHomeProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  onError?: (error: string) => void
  onPlaceSelect?: (place: any) => void
  showHomeButton?: boolean
}

export function AddressAutocompleteWithHome({
  value,
  onChange,
  placeholder,
  id,
  onError,
  onPlaceSelect,
  showHomeButton = false,
}: AddressAutocompleteWithHomeProps) {
  const [homeAddress, setHomeAddress] = useState<string>("")

  // Load home address from localStorage and listen for changes
  useEffect(() => {
    const loadHomeAddress = () => {
      const savedHomeAddress = localStorage.getItem("home-address")
      if (savedHomeAddress) {
        setHomeAddress(savedHomeAddress)
      }
    }

    // Load initially
    loadHomeAddress()

    // Listen for storage changes (when home address is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "home-address") {
        loadHomeAddress()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also check periodically in case localStorage was updated in the same tab
    const interval = setInterval(loadHomeAddress, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const handleUseHomeAddress = () => {
    if (homeAddress) {
      onChange(homeAddress)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <AddressAutocomplete
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onError={onError}
            onPlaceSelect={onPlaceSelect}
          />
        </div>
        {showHomeButton && homeAddress && (
          <Button
            type="button"
            variant="outline"
            onClick={handleUseHomeAddress}
            className="flex items-center gap-2 whitespace-nowrap px-3"
            title={`Use home address: ${homeAddress}`}
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        )}
      </div>
      {showHomeButton && homeAddress && (
        <p className="text-xs text-muted-foreground">
          💡 Click "Home" to use: {homeAddress.length > 50 ? homeAddress.substring(0, 50) + "..." : homeAddress}
        </p>
      )}
      {showHomeButton && !homeAddress && (
        <p className="text-sm text-muted-foreground">Set up your home address above to use the Home button</p>
      )}
    </div>
  )
}
