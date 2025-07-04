"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Key, AlertTriangle, Copy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ApiKeySetupProps {
  hasError?: boolean
  errorMessage?: string
}

export function ApiKeySetup({ hasError = false, errorMessage }: ApiKeySetupProps) {
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [copied, setCopied] = useState(false)

  // Get current domain
  const currentDomain = typeof window !== "undefined" ? window.location.origin : ""
  const currentHost = typeof window !== "undefined" ? window.location.hostname : ""

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Check if this is an API restriction error
  const isApiBlockedError =
    errorMessage?.includes("ApiTargetBlockedMapError") ||
    errorMessage?.includes("API restrictions") ||
    errorMessage?.includes("blocked")

  if (hasApiKey && !hasError) {
    return null
  }

  return (
    <Card className={`mb-6 ${hasError ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${hasError ? "text-red-800" : "text-orange-800"}`}>
          {hasError ? <AlertTriangle className="h-5 w-5" /> : <Key className="h-5 w-5" />}
          {hasError
            ? isApiBlockedError
              ? "Google Maps API Restriction Error"
              : "Google Maps API Error"
            : "Google Maps API Setup Required"}
        </CardTitle>
        <CardDescription className={hasError ? "text-red-700" : "text-orange-700"}>
          {hasError
            ? isApiBlockedError
              ? "Your API key has incorrect API restrictions configured."
              : "There was an issue with the Google Maps API configuration."
            : "To use real Australian address autocomplete and distance calculation, you need to set up a Google Maps API key."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isApiBlockedError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <p>
                  <strong>API Restriction Issue:</strong> Your API key is blocking the required Google Maps APIs.
                </p>

                <div>
                  <p className="font-medium mb-2">Fix this by configuring API restrictions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>
                      Go to{" "}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Google Cloud Credentials
                      </a>
                    </li>
                    <li>Click on your API key to edit it</li>
                    <li>
                      Under "API restrictions", select <strong>"Restrict key"</strong>
                    </li>
                    <li>
                      Check these APIs:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>✅ Maps JavaScript API</li>
                        <li>✅ Places API</li>
                        <li>✅ Distance Matrix API</li>
                      </ul>
                    </li>
                    <li>Click "Save"</li>
                  </ol>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {hasError && currentDomain && !isApiBlockedError && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <p>
                  <strong>Current Domain:</strong>
                </p>
                <div className="flex items-center gap-2 p-2 bg-white rounded border font-mono text-sm">
                  <span className="flex-1">{currentDomain}/*</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${currentDomain}/*`)}
                    className="h-6 px-2"
                  >
                    {copied ? "Copied!" : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-sm">Add this domain to your API key's HTTP referrer restrictions.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert className={hasError ? "border-yellow-200 bg-yellow-50" : ""}>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className={hasError ? "text-yellow-800" : ""}>
            <strong>Complete Setup Checklist:</strong>
            <div className="mt-2 space-y-2">
              <div className="space-y-1">
                <p className="font-medium">1. Enable Required APIs:</p>
                <div className="ml-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <a
                      href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Maps JavaScript API
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <a
                      href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Places API
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <a
                      href="https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Distance Matrix API
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-medium">2. Configure API Key Restrictions:</p>
                <div className="ml-4 text-sm">
                  <p>
                    Go to{" "}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Credentials
                    </a>{" "}
                    → Edit your API key
                  </p>

                  <div className="mt-2">
                    <p className="font-medium">Application restrictions (HTTP referrers):</p>
                    <div className="ml-2 mt-1 space-y-1 font-mono text-xs bg-gray-100 p-2 rounded">
                      {currentDomain && <div>{currentDomain}/*</div>}
                      <div>*.v0.dev/*</div>
                      <div>*.vusercontent.net/*</div>
                      <div>localhost:*</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="font-medium">API restrictions:</p>
                    <div className="ml-2 mt-1 text-xs">
                      <p>Select "Restrict key" and check:</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Maps JavaScript API</li>
                        <li>Places API</li>
                        <li>Distance Matrix API</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-medium">3. Enable Billing:</p>
                <div className="ml-4 text-sm">
                  <a
                    href="https://console.cloud.google.com/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Enable billing for your project
                  </a>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>💡 Pro Tip:</strong> If you're still getting errors after following these steps:
            <ul className="list-disc list-inside mt-1 ml-4 text-sm">
              <li>Wait 5-10 minutes for changes to propagate</li>
              <li>Try refreshing the page</li>
              <li>Check the browser console for additional error details</li>
              <li>Verify your project has billing enabled</li>
            </ul>
          </AlertDescription>
        </Alert>

        <p className="text-sm text-gray-600">
          <strong>Note:</strong> The app will use estimated distances while API issues are being resolved.
        </p>
      </CardContent>
    </Card>
  )
}
