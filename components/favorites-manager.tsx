"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Star, Plus, Trash2 } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { supabase } from "@/lib/supabase"

interface FavoriteLocation {
  id: string
  label: string
  address: string
  created_at: string
}

interface FavoritesManagerProps {
  onFavoriteSelect?: (favorite: FavoriteLocation) => void
  onCloseMenu?: () => void
}

export function FavoritesManager({ onFavoriteSelect, onCloseMenu }: FavoritesManagerProps) {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([])
  const [isAddingFavorite, setIsAddingFavorite] = useState(false)
  const [newFavorite, setNewFavorite] = useState({ label: "", address: "" })

  useEffect(() => {
    const loadFavorites = async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) {
        console.error("Failed to fetch favorites:", error.message)
      } else {
        setFavorites(data || [])
      }
    }

    loadFavorites()
  }, [])

  const handleAddFavorite = async () => {
    const trimmedAddress = newFavorite.address.trim().toLowerCase()

    // Check for duplicates
    const duplicate = favorites.find(
      (fav) => fav.address.trim().toLowerCase() === trimmedAddress
    )

    if (duplicate) {
      alert("This address is already saved as a favorite.")
      return
    }

    const { data, error } = await supabase.from("favorites").insert([
      {
        label: newFavorite.label.trim(),
        address: newFavorite.address.trim(),
      },
    ])

    if (error) {
      console.error("Failed to save favorite:", error.message)
    } else {
      setFavorites((prev) => [...prev, ...(data || [])])
      setNewFavorite({ label: "", address: "" })
      setIsAddingFavorite(false)
    }
  }

  const handleDeleteFavorite = async (id: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id)
    if (error) {
      console.error("Failed to delete favorite:", error.message)
    } else {
      setFavorites((prev) => prev.filter((fav) => fav.id !== id))
    }
  }

  const handleUseFavorite = (favorite: FavoriteLocation) => {
    onFavoriteSelect?.(favorite)
    onCloseMenu?.()
  }

  const handlePlaceSelect = (place: any) => {
    const address = place.formatted_address || ""
    const label = place.name || address.split(",")[0] || ""
    setNewFavorite({ address, label })
  }

  const truncateAddress = (address: string, maxLength = 40) =>
    address.length <= maxLength ? address : address.substring(0, maxLength) + "..."

  return (
    <div>
      <div className="mb-4">
        <h3 className="flex items-center gap-2 font-semibold text-base">
          <Star className="h-4 w-4 text-yellow-500" />
          Favorite Locations
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Save frequently visited locations for quick selection
        </p>
      </div>

      {favorites.length === 0 ? (
        <Alert className="mb-4">
          <Star className="h-4 w-4" />
          <AlertDescription className="text-sm">
            No favorite locations saved yet. Add your frequently visited places to save time when
            creating trips.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2 mb-4">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{favorite.label}</div>
                <div className="text-xs text-muted-foreground truncate" title={favorite.address}>
                  {truncateAddress(favorite.address)}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                {onFavoriteSelect && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUseFavorite(favorite)}
                    className="h-7 px-2 text-xs"
                  >
                    Use
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteFavorite(favorite.id)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button onClick={() => setIsAddingFavorite(true)} className="w-full" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Favorite Location
      </Button>

      <Dialog open={isAddingFavorite} onOpenChange={setIsAddingFavorite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Favorite Location</DialogTitle>
            <DialogDescription>
              Save a location you visit frequently for quick selection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="favorite-label">Location Name</Label>
              <Input
                id="favorite-label"
                placeholder="e.g., Main Office, Client ABC, Home Office"
                value={newFavorite.label}
                onChange={(e) =>
                  setNewFavorite((prev) => ({ ...prev, label: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="favorite-address">Address</Label>
              <AddressAutocomplete
                id="favorite-address"
                value={newFavorite.address}
                onChange={(value) =>
                  setNewFavorite((prev) => ({ ...prev, address: value }))
                }
                placeholder="Search for the address or business name"
                onPlaceSelect={handlePlaceSelect}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddFavorite}
                disabled={!newFavorite.label.trim() || !newFavorite.address.trim()}
                className="flex-1"
              >
                Add Favorite
              </Button>
              <Button onClick={() => setIsAddingFavorite(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}