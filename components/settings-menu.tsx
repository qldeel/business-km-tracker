"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Menu } from "lucide-react"
import { HomeAddressSetup } from "@/components/home-address-setup"
import { FavoritesManager } from "@/components/favorites-manager"
import { DataExport } from "@/components/data-export"
import { supabase } from "@/lib/supabase"

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false)

  // Prevent closing when clicking on Google Maps autocomplete suggestions
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        const pacContainers = document.querySelectorAll(".pac-container")
        const hasVisibleAutocomplete = Array.from(pacContainers).some(
          (container) => (container as HTMLElement).style.display !== "none",
        )

        if (!hasVisibleAutocomplete) {
          setIsOpen(false)
        }
      }, 100)
    } else {
      setIsOpen(open)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-12 w-12 p-3 hover:bg-gray-100 rounded-lg">
          <Menu style={{ height: "36px", width: "36px" }} strokeWidth={3} />
          <span className="sr-only">Open settings menu</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 p-0 max-h-[80vh] overflow-hidden"
        onInteractOutside={(e) => {
          const target = e.target as Element
          if (target?.closest(".pac-container") || target?.closest(".pac-item")) {
            e.preventDefault()
          }
        }}
      >
        <div className="overflow-y-auto max-h-[80vh]">
          <div className="p-4 space-y-6">
            <div className="border-b pb-2 mb-4">
              <h3 className="font-semibold text-lg">Settings</h3>
              <p className="text-sm text-muted-foreground">Manage your addresses and preferences</p>
            </div>
            <HomeAddressSetup />
            <FavoritesManager onCloseMenu={() => setIsOpen(false)} />
            {/* <DataExport /> */}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
