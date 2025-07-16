"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Menu, LogOut, X } from "lucide-react"
import { HomeAddressSetup } from "@/components/home-address-setup"
import { FavoritesManager } from "@/components/favorites-manager"
import { DataExport } from "@/components/data-export"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut, user } = useAuth()

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
        <Button variant="ghost" className="h-12 w-12 p-2.5 hover:bg-gray-800 rounded-lg transition-colors">
          <Menu className="h-6 w-6 text-white" strokeWidth={2.5} />
          <span className="sr-only">Open settings menu</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-96 p-0 max-h-[80vh] overflow-hidden ml-2 bg-gray-100"
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage your addresses and preferences</p>
                  {user && (
                    <p className="text-xs text-gray-500 mt-1">Signed in as: {user.email}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close settings</span>
                </Button>
              </div>
            </div>
            <HomeAddressSetup />
            <FavoritesManager onCloseMenu={() => setIsOpen(false)} />
            {/* <DataExport /> */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  signOut()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
