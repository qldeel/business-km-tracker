"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { AuthForm } from "@/components/auth/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, MapPin, Car, FileText, Plus, Clock, AlertCircle, Building2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { cn } from "@/lib/utils"
import { ApiKeySetup } from "@/components/api-key-setup"
import { calculateRealDistance } from "@/lib/google-maps"
import { AddressAutocompleteWithFavorites } from "@/components/address-autocomplete-with-favorites"
import { TripCard } from "@/components/trip-card"
import { SettingsMenu } from "@/components/settings-menu"
import { supabase } from "@/lib/supabase"

const exportTripsToCSV = (trips: Trip[]) => {
  if (trips.length === 0) return

  const headers = ["Date", "Start Address", "End Address", "KM", "Duration", "Purpose", "Notes"]
  const rows = trips.map((trip) => [
    trip.date,
    trip.start_address,
    trip.end_address,
    trip.km,
    trip.duration || "",
    trip.purpose,
    trip.notes || ""
  ])

  const csvContent =
    [headers, ...rows]
      .map((row) =>
        row
          .map((field) =>
            `"${String(field).replace(/"/g, '""')}"` // escape quotes
          )
          .join(",")
      )
      .join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const timestamp = new Date().toISOString().split("T")[0]
  link.setAttribute("href", url)
  link.setAttribute("download", `km-report-${timestamp}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

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



// Fallback simulated distance calculation for when API is not available
const calculateFallbackDistance = async (
  start: string,
  end: string,
): Promise<{ distance: number; duration: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const distance = Math.round((Math.random() * 50 + 5) * 10) / 10
  const duration = `${Math.round(distance * 2)} mins`
  return { distance, duration }
}

export default function KilometreTracker() {
  const { user, loading } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [newTrip, setnewTrip] = useState({
    start_address: "",
    end_address: "",
    purpose: "",
    notes: "",
    date: format(new Date(), "yyyy-MM-dd"),
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [reportDateFrom, setReportDateFrom] = useState<Date>()
  const [reportDateTo, setReportDateTo] = useState<Date>()
  const [reportPeriod, setReportPeriod] = useState<string>("")
  const [apiError, setApiError] = useState<string | null>(null)
  const [selectedStartPlace, setSelectedStartPlace] = useState<any>(null)
  const [selectedEndPlace, setSelectedEndPlace] = useState<any>(null)
  const [homeAddress, setHomeAddress] = useState<string>("")
  const [refreshKey, setRefreshKey] = useState(0)

  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Load trips on mount
  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })

      if (error) {
        console.error("Error loading trips:", error)
        return
      }

      setTrips(data)
    }

    fetchTrips()
  }, [user])

  // Load home address from Supabase
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
        }
      } catch (error) {
        console.error("Error loading home address:", error)
      }
    }

    loadHomeAddress()
  }, [user])

  // Listen for home address updates
  useEffect(() => {
    const handleHomeAddressUpdate = (event: CustomEvent) => {
      setHomeAddress(event.detail)
      setRefreshKey((prev) => prev + 1) // Force re-render of components
    }

    window.addEventListener("homeAddressUpdated", handleHomeAddressUpdate as EventListener)

    return () => {
      window.removeEventListener("homeAddressUpdated", handleHomeAddressUpdate as EventListener)
    }
  }, [])

  const handleAddTrip = async () => {
  console.log("🚀 [HandleAddTrip] Starting trip save process")
  console.log("📊 [HandleAddTrip] Current newTrip state:", JSON.stringify(newTrip, null, 2))
  
  if (!newTrip.start_address || !newTrip.end_address) {
    console.log("❌ [HandleAddTrip] Missing addresses - start:", newTrip.start_address, "end:", newTrip.end_address)
    return
  }

  setIsCalculating(true)
  setCalculationError(null)

  try {
    let distanceData: { distance: number; duration: string }

    if (hasApiKey && !apiError) {
      try {
        console.log("🗺️ [HandleAddTrip] Using Google Maps API for distance calculation")
        distanceData = await calculateRealDistance(newTrip.start_address, newTrip.end_address)
        console.log("🗺️ [HandleAddTrip] Distance calculated:", distanceData)
      } catch (apiError) {
        console.warn("Google Maps API failed, using fallback:", apiError)
        distanceData = await calculateFallbackDistance(newTrip.start_address, newTrip.end_address)
        setCalculationError("Used estimated distance - Google Maps API error")
      }
    } else {
      console.log("📏 [HandleAddTrip] Using fallback distance calculation")
      distanceData = await calculateFallbackDistance(newTrip.start_address, newTrip.end_address)
      setCalculationError("Using estimated distance - no Google Maps API")
    }

    // ✅ Send to Supabase
    const tripToSave = {
      date: newTrip.date,
      start_address: newTrip.start_address,
      end_address: newTrip.end_address,
      km: distanceData.distance,
      duration: distanceData.duration,
      purpose: newTrip.purpose,
      notes: newTrip.notes,
      user_id: user!.id,
    }
    
    console.log("💾 [HandleAddTrip] Saving trip to database:", JSON.stringify(tripToSave, null, 2))
    console.log("🎯 [HandleAddTrip] Start address being saved:", tripToSave.start_address)
    console.log("🎯 [HandleAddTrip] End address being saved:", tripToSave.end_address)
    
    const { data, error } = await supabase.from("trips").insert([tripToSave]).select()

    if (error) {
      console.log("❌ [HandleAddTrip] Database error:", error)
      throw error
    }

    console.log("✅ [HandleAddTrip] Trip saved successfully:", JSON.stringify(data[0], null, 2))
    console.log("✅ [HandleAddTrip] Saved start_address:", data[0].start_address)
    console.log("✅ [HandleAddTrip] Saved end_address:", data[0].end_address)

    // ✅ Add it to UI
    setTrips((prev) => [data[0], ...prev])
    setnewTrip({
      start_address: "",
      end_address: "",
      purpose: "",
      notes: "",
      date: format(new Date(), "yyyy-MM-dd"),
    })
    setSelectedStartPlace(null)
    setSelectedEndPlace(null)
    console.log("🔄 [HandleAddTrip] Trip form reset")
  } catch (error: any) {
  console.error("Error calculating distance or saving trip:", error?.message || error)
  setCalculationError(error?.message || "Failed to calculate or save trip. Please try again.")
  } finally {
    setIsCalculating(false)
  }
}

  const handleDeleteTrip = async (tripId: string) => {
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", tripId)
      .eq("user_id", user!.id)

    if (error) {
      console.error("Failed to delete trip:", error)
      return
    }

    setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
  }

  const generateReport = () => {
    let filteredTrips = trips

    if (reportPeriod === "this-month") {
      const now = new Date()
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      filteredTrips = trips.filter((trip) => isWithinInterval(new Date(trip.date), { start, end }))
    } else if (reportPeriod === "custom" && reportDateFrom && reportDateTo) {
      filteredTrips = trips.filter((trip) =>
        isWithinInterval(new Date(trip.date), {
          start: reportDateFrom,
          end: reportDateTo,
        }),
      )
    }

    return {
      trips: filteredTrips,
      totalTrips: filteredTrips.length,
      totalKilometers: filteredTrips.reduce((sum, trip) => sum + trip.km, 0),
    }
  }

  const report = generateReport()

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Handle unauthenticated state
  if (!user) {
    return <AuthForm />
  }

  return (
    


    <div className="container mx-auto px-4 py-4 max-w-6xl min-h-screen">
  {/* Mobile App Header */}
  <header className="sticky top-0 z-50 flex items-center justify-between mb-6 py-3 -mx-4 px-4 bg-black backdrop-blur-sm border-b border-gray-800 md:py-2 md:mx-0 md:px-0">
    {/* Menu Icon */}
    <div className="flex-shrink-0">
      <SettingsMenu />
    </div>
    
    {/* Centered Title */}
    <div className="flex-1 text-center px-3">
      <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white truncate">Business Kilometre Tracker</h1>
    </div>
    
    {/* Spacer for balance (same width as menu) */}
    <div className="flex-shrink-0 w-12 h-12"></div>
  </header>


      <ApiKeySetup hasError={!!apiError} errorMessage={apiError || undefined} />

      <Tabs defaultValue="add-trip" className="space-y-8 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-14 md:h-10 text-base md:text-sm">
          <TabsTrigger value="add-trip" className="flex items-center gap-2 py-3 md:py-2">
            <Plus className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Add Trip</span>
            <span className="sm:hidden">Add</span>
          </TabsTrigger>
          <TabsTrigger value="trip-history" className="flex items-center gap-2 py-3 md:py-2">
            <Car className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Trip History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2 py-3 md:py-2">
            <FileText className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Reports</span>
            <span className="sm:hidden">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add-trip">
          <Card className="bg-gray-100">
            <CardHeader>
              <CardTitle className="text-center text-xl md:text-3xl" style={{color: '#1a53ff'}}>
                Add New Trip
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-4">
              {calculationError && (
                <Alert>
                  <AlertCircle className="h-5 w-5 md:h-4 md:w-4" />
                  <AlertDescription className="text-base md:text-sm">{calculationError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
                <div className="space-y-3 md:space-y-2">
                  <Label htmlFor="date" className="text-base md:text-sm font-medium">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newTrip.date}
                    onChange={(e) => setnewTrip((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-3 md:space-y-2">
                  <Label htmlFor="purpose" className="text-base md:text-sm font-medium">Purpose (Optional)</Label>
                  <Input
                    id="purpose"
                    placeholder="eg: Meeting, conference etc"
                    value={newTrip.purpose}
                    onChange={(e) => setnewTrip((prev) => ({ ...prev, purpose: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3 md:space-y-2">
                <Label htmlFor="start" className="flex items-center gap-2 text-base md:text-sm font-medium">
                  <MapPin className="h-5 w-5 md:h-4 md:w-4 text-green-500" />
                  Starting Location
                </Label>
                <AddressAutocompleteWithFavorites
                  key={`start-${refreshKey}`}
                  id="start"
                  value={newTrip.start_address}
                  onChange={(value) => {
                    console.log("🎯 [StartAddress] onChange received value:", value)
                    setnewTrip((prev) => {
                      const newState = { ...prev, start_address: value }
                      console.log("🎯 [StartAddress] Setting start_address in state to:", value)
                      console.log("🎯 [StartAddress] Full newTrip state:", newState)
                      return newState
                    })
                  }}
                  placeholder="Search for business name, address, or landmark"
                  onError={setApiError}
                  onPlaceSelect={(place) => {
                    console.log("🔔 [StartAddress] onPlaceSelect called with place:", place)
                    setSelectedStartPlace(place)
                    // Handle the full formatted address with business name if applicable
                    if (place) {
                      let selectedAddress = ""

                      // If it's a business/establishment, use the name + address
                      if (
                        place.name &&
                        place.types &&
                        (place.types.includes("establishment") ||
                          place.types.includes("point_of_interest") ||
                          place.types.includes("store") ||
                          place.types.includes("restaurant") ||
                          place.types.includes("lodging") ||
                          place.types.includes("hospital") ||
                          place.types.includes("school") ||
                          place.types.includes("university"))
                      ) {
                        selectedAddress = `${place.name}, ${place.formatted_address}`
                        console.log("🏢 [StartAddress] Business detected in onPlaceSelect - selectedAddress:", selectedAddress)
                      } else {
                        // For regular addresses, just use the formatted address
                        selectedAddress = place.formatted_address || ""
                        console.log("🏠 [StartAddress] Regular address in onPlaceSelect - selectedAddress:", selectedAddress)
                      }

                      if (selectedAddress) {
                        console.log("📝 [StartAddress] onPlaceSelect setting start_address to:", selectedAddress)
                        setnewTrip((prev) => {
                          const newState = { ...prev, start_address: selectedAddress }
                          console.log("📝 [StartAddress] onPlaceSelect new state:", newState)
                          return newState
                        })
                      }
                    }
                  }}
                  showHomeButton={true}
                  showFavoritesButton={true}
                />
              </div>

              <div className="space-y-3 md:space-y-2">
                <Label htmlFor="end" className="flex items-center gap-2 text-base md:text-sm font-medium">
                  <MapPin className="h-5 w-5 md:h-4 md:w-4 text-red-500" />
                  Destination
                </Label>
                <AddressAutocompleteWithFavorites
                  id="end"
                  value={newTrip.end_address}
                  onChange={(value) => setnewTrip((prev) => ({ ...prev, end_address: value }))}
                  placeholder="Search for business name, address, or landmark"
                  onError={setApiError}
                  onPlaceSelect={(place) => {
                    setSelectedEndPlace(place)
                    // Handle the full formatted address with business name if applicable
                    if (place) {
                      let selectedAddress = ""

                      // If it's a business/establishment, use the name + address
                      if (
                        place.name &&
                        place.types &&
                        (place.types.includes("establishment") ||
                          place.types.includes("point_of_interest") ||
                          place.types.includes("store") ||
                          place.types.includes("restaurant") ||
                          place.types.includes("lodging") ||
                          place.types.includes("hospital") ||
                          place.types.includes("school") ||
                          place.types.includes("university"))
                      ) {
                        selectedAddress = `${place.name}, ${place.formatted_address}`
                      } else {
                        // For regular addresses, just use the formatted address
                        selectedAddress = place.formatted_address || ""
                      }

                      if (selectedAddress) {
                        setnewTrip((prev) => ({ ...prev, end_address: selectedAddress }))
                      }
                    }
                  }}
                  showHomeButton={true}
                  showFavoritesButton={true}
                />
              </div>

              <div className="space-y-3 md:space-y-2">
                <Label htmlFor="notes" className="text-base md:text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the trip"
                  value={newTrip.notes}
                  onChange={(e) => setnewTrip((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleAddTrip}
                disabled={isCalculating || !newTrip.start_address || !newTrip.end_address}
                className="w-full"
              >
                {isCalculating ? "Calculating Distance..." : "Add Trip"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trip-history">
          <Card className="bg-gray-100">
            <CardHeader>
              <CardTitle className="text-center" style={{color: '#1a53ff'}}>Trip History</CardTitle>
              <CardDescription>
                View all your recorded business trips. Click on addresses to add them to favorites. Select trips to
                delete them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trips recorded yet. Add your first trip to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} onDelete={handleDeleteTrip} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-6">
            <Card className="lg:col-span-1 bg-gray-100">
              <CardHeader>
                <CardTitle className="text-center" style={{color: '#1a53ff'}}>Report Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 md:space-y-4">
                <div className="space-y-3 md:space-y-2">
                  <Label className="text-base md:text-sm font-medium">Report Period</Label>
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportPeriod === "custom" && (
                  <div className="space-y-6 md:space-y-4">
                    <div className="space-y-3 md:space-y-2">
                      <Label className="text-base md:text-sm font-medium">From Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !reportDateFrom && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {reportDateFrom ? format(reportDateFrom, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={reportDateFrom} onSelect={setReportDateFrom} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-3 md:space-y-2">
                      <Label className="text-base md:text-sm font-medium">To Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !reportDateTo && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {reportDateTo ? format(reportDateTo, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={reportDateTo} onSelect={setReportDateTo} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => exportTripsToCSV(report.trips)}
                    disabled={report.trips.length === 0}
                    className="px-6"
                  >
                    Export as CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-gray-100">
              <CardHeader>
                <CardTitle className="text-center" style={{color: '#1a53ff'}}>Report Summary</CardTitle>
                <CardDescription className="text-center">
                {reportPeriod === "this-month" && "This month's business travel summary"}
                {reportPeriod === "custom" &&
                  reportDateFrom &&
                  reportDateTo &&
                  `${format(reportDateFrom, "MMM dd, yyyy")} - ${format(reportDateTo, "MMM dd, yyyy")}`}
                {reportPeriod === "all" && "All time business travel summary"}
                {!reportPeriod && "Select a report period to view summary"}
                  </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 mb-8 md:gap-4 md:mb-6">
                  <div className="text-center p-6 md:p-4 border rounded-lg bg-white">
                    <div className="text-3xl md:text-2xl font-bold text-black">{report.totalTrips}</div>
                    <div className="text-base md:text-sm text-muted-foreground">Total Trips</div>
                  </div>
                  <div className="text-center p-6 md:p-4 border rounded-lg bg-white">
                    <div className="text-3xl md:text-2xl font-bold text-black">{report.totalKilometers.toFixed(1)} km</div>
                    <div className="text-base md:text-sm text-muted-foreground">Total Distance</div>
                  </div>
                </div>

                {report.trips.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Trip Details</h4>
                    <div className="max-h-64 overflow-y-auto space-y-3">
                      {report.trips.map((trip) => (
                        <div key={trip.id} className="p-3 border rounded-lg bg-white">
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
                          </div>
                          
                          <div className="mb-2 text-sm text-muted-foreground">
                            <span className="font-medium">Purpose:</span> {trip.purpose || "No purpose specified"}
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="font-medium">From:</span> {trip.start_address}
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="font-medium">To:</span> {trip.end_address}
                              </div>
                            </div>
                            {trip.notes && (
                              <div className="mt-2 text-muted-foreground">
                                <span className="font-medium">Notes:</span> {trip.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
