"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Home, Star, ChevronDown, Trash2 } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { supabase } from "@/lib/supabase"

interface FavoriteLocation {
  id: string
  label: string
  address: string
  created_at: string
}

interface AddressAutocompleteWithFavoritesProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  onError?: (error: string) => void
  onPlaceSelect?: (place: any) => void
  showHomeButton?: boolean
  showFavoritesButton?: boolean
}

export function AddressAutocompleteWithFavorites({
  value,
  onChange,
  placeholder,
  id,
  onError,
  onPlaceSelect,
  showHomeButton = false,
  showFavoritesButton = true,
}: AddressAutocompleteWithFavoritesProps) {
  const [homeAddress, setHomeAddress] = useState<string>("")
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const savedHomeAddress = localStorage.getItem("home-address")
      if (savedHomeAddress) {
        setHomeAddress(savedHomeAddress)
      }

      const { data, error } = await supabase.from("favorites").select("*").order("created_at", { ascending: false })
      if (error) {
        console.error("Failed to fetch favorites:", error.message)
      } else {
        setFavorites(data || [])
      }
    }

    loadData()
  }, [])

  const handleUseHomeAddress = () => {
    if (homeAddress) {
      onChange(homeAddress)
    }
  }

  const handleUseFavorite = (favorite: FavoriteLocation) => {
    onChange(favorite.address)
    setIsPopoverOpen(false)
  }

  const handleSaveAsFavorite = async () => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    const duplicate = favorites.find((f) => f.address === trimmedValue)
    if (duplicate) {
      console.log("Duplicate address, not saving")
      return
    }

    const label = trimmedValue.split(",")[0] || trimmedValue.substring(0, 30)
    const { data, error } = await supabase.from("favorites").insert([
      {
        label,
        address: trimmedValue,
      },
    ])

    if (error) {
      console.error("Failed to save favorite:", error.message)
    } else {
      setFavorites((prev) => [...prev, ...(data || [])])
    }
  }

  const handleDeleteFavorite = async (favoriteId: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", favoriteId)
    if (error) {
      console.error("Failed to delete favorite:", error.message)
    } else {
      setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId))
    }
  }

  return (
    <div className="space-y-3 md:space-y-0 md:flex md:gap-2">
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

      <div className="flex gap-2 md:flex-shrink-0">
        {showHomeButton && homeAddress && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseHomeAddress}
            className="flex items-center gap-2 whitespace-nowrap flex-1 md:flex-initial md:px-3 justify-center md:justify-start"
            title={`Use home address: ${homeAddress}`}
          >
            <Home className="h-5 w-5 md:h-4 md:w-4" />
            <span className="md:inline">Home</span>
          </Button>
        )}

        {showFavoritesButton && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap flex-1 md:flex-initial md:px-3 justify-center md:justify-start"
                disabled={favorites.length === 0}
              >
                <Star className="h-5 w-5 md:h-4 md:w-4" />
                <span className="md:inline">Favorites</span>
                <ChevronDown className="h-4 w-4 md:h-3 md:w-3" />
              </Button>
            </PopoverTrigger>
          <PopoverContent className="w-80 md:w-80 p-0" align="end">
            <div className="p-4 md:p-3">
              <div className="text-base md:text-sm font-medium mb-3 md:mb-2">Favorite Locations</div>
              {favorites.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No favorites saved yet. Add some in the Favorites section above.
                </div>
              ) : (
                <div className="space-y-2 md:space-y-1 max-h-48 overflow-y-auto">
                  {favorites.map((favorite) => (
                    <div key={favorite.id} className="flex items-center justify-between gap-3 md:gap-2 p-3 md:p-2 rounded hover:bg-gray-100 border border-transparent hover:border-gray-200">
                      <button
                        onClick={() => handleUseFavorite(favorite)}
                        className="flex-1 text-left touch-target"
                      >
                        <div className="font-medium text-base md:text-sm">{favorite.label}</div>
                        <div className="text-sm md:text-xs text-muted-foreground truncate">{favorite.address}</div>
                      </button>
                      <button onClick={() => handleDeleteFavorite(favorite.id)} title="Delete" className="text-red-500 hover:text-red-700 touch-target p-2 md:p-1">
                        <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {value.trim() && !favorites.some((f) => f.address === value.trim()) && (
                <div className="border-t pt-3 mt-3 md:pt-2 md:mt-2">
                  <Button onClick={handleSaveAsFavorite} variant="outline" size="sm" className="w-full text-sm md:text-xs">
                    <Star className="h-4 w-4 md:h-3 md:w-3 mr-2 md:mr-1" />
                    Save Current Address as Favorite
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
      </div>
    </div>
  )
}
