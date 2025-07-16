"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MapPin, Clock, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { AddressWithActions } from "@/components/address-with-actions"

interface Trip {
  id: string
  date: string
  start_address: string
  end_address: string
  km: number
  duration?: string
  purpose: string
  notes?: string
}

interface TripCardProps {
  trip: Trip
  onDelete: (tripId: string) => void
}

export function TripCard({ trip, onDelete }: TripCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = () => {
    setIsDeleting(true)
    onDelete(trip.id)
    setIsDeleting(false)
  }

  return (
    <div className="border rounded-lg p-4 group hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{format(new Date(trip.date), "MMM dd, yyyy")}</Badge>
          <Badge>{trip.km} km</Badge>
          {trip.duration && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {trip.duration}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this trip? This action cannot be undone.
                </AlertDialogDescription>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium">
                    {format(new Date(trip.date), "MMM dd, yyyy")} - {trip.km} km
                  </div>
                  <div className="text-gray-600 mt-1">
                    From:{" "}
                    {trip.start_address?.length > 50
                      ? trip.start_address.substring(0, 50) + "..."
                      : trip.start_address || "—"}
                  </div>
                  <div className="text-gray-600">
                    To:{" "}
                    {trip.end_address?.length > 50
                      ? trip.end_address.substring(0, 50) + "..."
                      : trip.end_address || "—"}
                  </div>
                  {trip.purpose && <div className="text-gray-600">Purpose: {trip.purpose}</div>}
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                  Delete Trip
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="mb-2 text-sm text-muted-foreground">
        <span className="font-medium">Purpose:</span> {trip.purpose || "No purpose specified"}
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-medium">From:</span>{" "}
            <AddressWithActions address={trip.start_address} />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-medium">To:</span>{" "}
            <AddressWithActions address={trip.end_address} />
          </div>
        </div>
        {trip.notes && (
          <div className="mt-2 text-muted-foreground">
            <span className="font-medium">Notes:</span> {trip.notes}
          </div>
        )}
      </div>
    </div>
  )
}