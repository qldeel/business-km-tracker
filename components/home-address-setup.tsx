"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Home, Edit, Save, X, Check } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"

interface HomeAddressSetupProps {
  onHomeAddressChange?: (address: string) => void
}

export function HomeAddressSetup({ onHomeAddressChange }: HomeAddressSetupProps) {
  const { user } = useAuth()
  const [homeAddress, setHomeAddress] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [tempAddress, setTempAddress] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Load home address from Supabase on mount and migrate from localStorage if needed
  useEffect(() => {
    const loadHomeAddress = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("user_addresses")
          .select("address")
          .eq("user_id", user.id)
          .eq("address_type", "home")
          .eq("is_default", true)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading home address:", error)
          return
        }

        if (data?.address) {
          setHomeAddress(data.address)
          onHomeAddressChange?.(data.address)
        } else {
          // Migration: Check localStorage for existing home address
          const savedHomeAddress = localStorage.getItem("home-address")
          if (savedHomeAddress) {
            // Migrate to Supabase
            const { error: insertError } = await supabase
              .from("user_addresses")
              .insert({
                user_id: user.id,
                address_type: "home",
                address: savedHomeAddress,
                label: "Home",
                is_default: true
              })

            if (!insertError) {
              setHomeAddress(savedHomeAddress)
              onHomeAddressChange?.(savedHomeAddress)
              // Remove from localStorage after successful migration
              localStorage.removeItem("home-address")
              console.log("Successfully migrated home address to Supabase")
            } else {
              console.error("Error migrating home address:", insertError)
            }
          }
        }
      } catch (error) {
        console.error("Error loading home address:", error)
      }
    }

    loadHomeAddress()
  }, [user, onHomeAddressChange])

  const handleSaveHomeAddress = async () => {
    if (!tempAddress.trim() || !user) return

    setIsLoading(true)
    try {
      // First, check if a home address already exists
      const { data: existingAddress } = await supabase
        .from("user_addresses")
        .select("id")
        .eq("user_id", user.id)
        .eq("address_type", "home")
        .eq("is_default", true)
        .single()

      if (existingAddress) {
        // Update existing address
        const { error } = await supabase
          .from("user_addresses")
          .update({ 
            address: tempAddress,
            label: "Home"
          })
          .eq("id", existingAddress.id)

        if (error) {
          console.error("Error updating home address:", error)
          return
        }
      } else {
        // Insert new address
        const { error } = await supabase
          .from("user_addresses")
          .insert({
            user_id: user.id,
            address_type: "home",
            address: tempAddress,
            label: "Home",
            is_default: true
          })

        if (error) {
          console.error("Error saving home address:", error)
          return
        }
      }

      setHomeAddress(tempAddress)
      onHomeAddressChange?.(tempAddress)
      setIsEditing(false)
      setTempAddress("")

      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent("homeAddressUpdated", { detail: tempAddress }))
    } catch (error) {
      console.error("Error saving home address:", error)
    } finally {
      setIsLoading(false)
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
            <Button onClick={handleSaveHomeAddress} disabled={!tempAddress.trim() || isLoading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Home Address"}
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
