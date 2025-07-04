"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Plus, Check, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface FavoriteLocation {
  id: string
  label: string
  address: string
  created_at: string
}

interface AddressWithActionsProps {
  address: string
  className?: string
}

export function AddressWithActions({ address, className = "" }: AddressWithActionsProps) {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isAddingFavorite, setIsAddingFavorite] = useState(false)
  const [favoriteName, setFavoriteName] = useState("")

  // Load favorites from Supabase
  useEffect(() => {
    const loadFavorites = async () => {
      const { data, error } = await supabase.from("favorites").select("*").order("created_at", { ascending: false })
      if (error) {
        console.error("Failed to fetch favorites:", error.message)
      } else {
        setFavorites(data || [])
      }
    }

    loadFavorites()
  }, [])

  const isAlreadyFavorite = favorites.some((fav) => fav.address === address)

  const handleAddToFavorites = async () => {
    if (favoriteName.trim() && address.trim()) {
      const alreadyExists = favorites.some(fav => fav.address === address.trim())
      if (alreadyExists) {
        console.warn("This address is already in favorites.")
        return
      }

      const { data, error } = await supabase.from("favorites").insert([
        {
          label: favoriteName.trim(),
          address: address.trim(),
        },
      ])

      if (error) {
        console.error("Failed to save favorite:", error.message)
      } else {
        setFavorites((prev) => [...prev, ...(data || [])])
        setFavoriteName("")
        setIsAddingFavorite(false)
        setIsPopoverOpen(false)
      }
    }
  }

  const handleStartAddingFavorite = () => {
    const defaultName = address.split(",")[0] || address.substring(0, 30)
    setFavoriteName(defaultName)
    setIsAddingFavorite(true)
  }

  const handleCancelAddingFavorite = () => {
    setFavoriteName("")
    setIsAddingFavorite(false)
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className={`text-left hover:bg-gray-50 rounded px-1 py-0.5 transition-colors cursor-pointer ${className}`}
          title="Click to add to favorites"
        >
          {address}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3">
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <div className="text-sm text-gray-700 flex-1">{address}</div>
          </div>

          {isAlreadyFavorite ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="h-4 w-4" />
              <span>Already in favorites</span>
            </div>
          ) : isAddingFavorite ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="favorite-name" className="text-sm font-medium">
                  Favorite Name
                </Label>
                <Input
                  id="favorite-name"
                  value={favoriteName}
                  onChange={(e) => setFavoriteName(e.target.value)}
                  placeholder="e.g., Main Office, Client ABC"
                  className="text-sm"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddToFavorites}
                  disabled={!favoriteName.trim()}
                  size="sm"
                  className="flex-1 text-xs"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Add to Favorites
                </Button>
                <Button onClick={handleCancelAddingFavorite} variant="outline" size="sm" className="text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleStartAddingFavorite} variant="outline" size="sm" className="w-full text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add to Favorites
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
