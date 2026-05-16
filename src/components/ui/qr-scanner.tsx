"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScan: (token: string) => void;
  onClose?: () => void;
  className?: string;
}

export function QRScanner({ onScan, onClose, className }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        // Scanner might already be stopped
      }
    }
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);

    try {
      // Dynamically import html5-qrcode
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!scannerRef.current) return;

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Success - found QR code
          stopScanner();
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors (no QR found in frame)
          // This is normal during scanning
        }
      );

      setHasPermission(true);
      setIsScanning(true);
    } catch (err: any) {
      console.error("QR Scanner Error:", err);

      if (err.message?.includes("Permission")) {
        setHasPermission(false);
        setError("Camera permission denied. Please allow camera access to scan QR codes.");
      } else if (err.message?.includes("NotFoundError") || err.message?.includes("no cameras")) {
        setError("No camera found on this device.");
      } else {
        setError("Failed to start camera. Please try again.");
      }
      setIsScanning(false);
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    // Auto-start scanner when component mounts
    startScanner();

    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleRetry = () => {
    stopScanner();
    startScanner();
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Scanner Container */}
      <div className="relative w-full max-w-sm">
        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full aspect-square rounded-xl overflow-hidden bg-black"
        />

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold rounded-br-lg" />

            {/* Scan line animation */}
            <div className="absolute left-4 right-4 h-0.5 bg-gold/50 animate-pulse top-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-4 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-status-error">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading/Instructions State */}
      {!isScanning && !error && (
        <div className="mt-4 flex flex-col items-center gap-3 text-center">
          <Camera className="w-8 h-8 text-text-muted animate-pulse" />
          <p className="text-sm text-text-secondary">
            {hasPermission === null
              ? "Initializing camera..."
              : hasPermission === false
              ? "Camera access required"
              : "Starting scanner..."}
          </p>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Instructions */}
      {isScanning && (
        <div className="mt-4 text-center">
          <p className="text-sm text-text-secondary">
            Point your camera at the event QR code
          </p>
        </div>
      )}
    </div>
  );
}
