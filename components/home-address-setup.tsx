"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Home, Edit, Save, X, Check } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"

interface HomeAddressSetupProps {
  onHomeAddressChange?: (address: string) => void
}

export function HomeAddressSetup({ onHomeAddressChange }: HomeAddressSetupProps) {
  const [homeAddress, setHomeAddress] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [tempAddress, setTempAddress] = useState<string>("")

  // Load home address from localStorage on mount
  useEffect(() => {
    const savedHomeAddress = localStorage.getItem("home-address")
    if (savedHomeAddress) {
      setHomeAddress(savedHomeAddress)
      onHomeAddressChange?.(savedHomeAddress)
    }
  }, [onHomeAddressChange])

  const handleSaveHomeAddress = () => {
    if (tempAddress.trim()) {
      setHomeAddress(tempAddress)
      localStorage.setItem("home-address", tempAddress)
      onHomeAddressChange?.(tempAddress)
      setIsEditing(false)
      setTempAddress("")

      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent("homeAddressUpdated", { detail: tempAddress }))
    }
  }

  const handleEditHomeAddress = () => {
    setTempAddress(homeAddress)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setTempAddress("")
    setIsEditing(false)
  }

  // Show setup card if no home address is saved and not editing
  if (!homeAddress && !isEditing) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Home className="h-5 w-5" />
            Home Address
          </CardTitle>
          <CardDescription className="text-blue-700">
            Save your home address for quick selection when starting trips from home.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsEditing(true)} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Set Home Address
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show editing dialog
  if (isEditing) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Home className="h-5 w-5" />
            Home Address
          </CardTitle>
          <CardDescription className="text-blue-700">
            Enter your home address to save it for quick selection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="home-address">Home Address</Label>
            <AddressAutocomplete
              id="home-address"
              value={tempAddress}
              onChange={setTempAddress}
              placeholder="Search for your home address"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveHomeAddress} disabled={!tempAddress.trim()} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Home Address
            </Button>
            <Button onClick={handleCancelEdit} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show compact saved indicator when home address exists
  return (
    <div className="mb-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 text-green-800">
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">Home address saved</span>
        <span className="text-xs text-green-600 hidden sm:inline">
          ({homeAddress.length > 50 ? homeAddress.substring(0, 50) + "..." : homeAddress})
        </span>
      </div>
      <Button
        onClick={handleEditHomeAddress}
        variant="ghost"
        size="sm"
        className="text-green-700 hover:text-green-800 hover:bg-green-100"
      >
        <Edit className="h-3 w-3 mr-1" />
        <span className="hidden sm:inline">Edit</span>
      </Button>
    </div>
  )
}
