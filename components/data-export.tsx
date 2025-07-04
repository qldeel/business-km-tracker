"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, Database, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface Trip {
  id: string
  date: string
  startAddress: string
  endAddress: string
  distance: number
  duration?: string
  purpose: string
  notes?: string
}

interface FavoriteLocation {
  id: string
  name: string
  address: string
  createdAt: string
}

export function DataExport() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([])
  const [homeAddress, setHomeAddress] = useState<string>("")
  const [exportStatus, setExportStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedTrips = localStorage.getItem("business-trips")
      if (savedTrips) {
        setTrips(JSON.parse(savedTrips))
      }

      const savedFavorites = localStorage.getItem("favorite-locations")
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }

      const savedHomeAddress = localStorage.getItem("home-address")
      if (savedHomeAddress) {
        setHomeAddress(savedHomeAddress)
      }
    }

    loadData()
  }, [])

  const showStatus = (type: "success" | "error", message: string) => {
    setExportStatus({ type, message })
    setTimeout(() => setExportStatus({ type: null, message: "" }), 3000)
  }

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    try {
      if (trips.length === 0) {
        showStatus("error", "No trips to export")
        return
      }

      // CSV headers
      const headers = ["Date", "Purpose", "Start Address", "End Address", "Distance (km)", "Duration", "Notes"]

      // Convert trips to CSV rows
      const csvRows = trips.map((trip) => [
        format(new Date(trip.date), "yyyy-MM-dd"),
        trip.purpose || "",
        `"${trip.startAddress.replace(/"/g, '""')}"`, // Escape quotes in addresses
        `"${trip.endAddress.replace(/"/g, '""')}"`,
        trip.distance.toString(),
        trip.duration || "",
        `"${(trip.notes || "").replace(/"/g, '""')}"`,
      ])

      // Combine headers and rows
      const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n")

      // Generate filename with current date
      const filename = `business-trips-${format(new Date(), "yyyy-MM-dd")}.csv`

      downloadFile(csvContent, filename, "text/csv")
      showStatus("success", `Exported ${trips.length} trips to ${filename}`)
    } catch (error) {
      console.error("CSV export error:", error)
      showStatus("error", "Failed to export CSV file")
    }
  }

  const exportToJSON = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        data: {
          trips: trips,
          favorites: favorites,
          homeAddress: homeAddress,
        },
        summary: {
          totalTrips: trips.length,
          totalDistance: trips.reduce((sum, trip) => sum + trip.distance, 0),
          totalFavorites: favorites.length,
        },
      }

      const jsonContent = JSON.stringify(exportData, null, 2)
      const filename = `business-tracker-backup-${format(new Date(), "yyyy-MM-dd")}.json`

      downloadFile(jsonContent, filename, "application/json")
      showStatus("success", `Complete backup exported to ${filename}`)
    } catch (error) {
      console.error("JSON export error:", error)
      showStatus("error", "Failed to export backup file")
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="flex items-center gap-2 font-semibold text-base">
          <Download className="h-4 w-4 text-blue-500" />
          Data Export & Backup
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Export your trip data for backup or import into other applications
        </p>
      </div>

      {exportStatus.type && (
        <Alert
          className={`mb-4 ${exportStatus.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          {exportStatus.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={exportStatus.type === "success" ? "text-green-800" : "text-red-800"}>
            {exportStatus.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="p-3 border rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium text-sm">
                <FileText className="h-4 w-4 text-green-600" />
                CSV Export
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Perfect for Excel, Google Sheets, or accounting software
              </div>
              <div className="text-xs text-muted-foreground">
                Includes: Date, addresses, distance, duration, purpose, notes
              </div>
            </div>
            <Button onClick={exportToCSV} size="sm" disabled={trips.length === 0} className="ml-3">
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        <div className="p-3 border rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium text-sm">
                <Database className="h-4 w-4 text-blue-600" />
                Complete Backup
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Full backup including trips, favorites, and home address
              </div>
              <div className="text-xs text-muted-foreground">JSON format - perfect for restoring data or migrating</div>
            </div>
            <Button onClick={exportToJSON} size="sm" variant="outline" className="ml-3">
              <Download className="h-3 w-3 mr-1" />
              Backup
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border border-blue-200">
          <strong>💡 Backup Tips:</strong>
          <ul className="mt-1 space-y-1 ml-2">
            <li>• Export regularly to avoid data loss</li>
            <li>• CSV files work great with Excel/Google Sheets</li>
            <li>• JSON backups preserve all your settings</li>
            <li>• Keep backups in cloud storage (Google Drive, Dropbox)</li>
          </ul>
        </div>
      </div>

      {trips.length === 0 && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No trips to export yet. Add some trips first, then come back to create backups.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
