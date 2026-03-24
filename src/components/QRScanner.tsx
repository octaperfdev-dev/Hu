import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function QRScanner({ onClose, onScan }: { onClose: () => void, onScan?: (text: string) => void }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          onClose();
          if (onScan) {
            onScan(decodedText);
          } else {
            // Assuming the QR code contains the full URL or just the path
            if (decodedText.startsWith('http')) {
              window.location.href = decodedText;
            } else {
              navigate(decodedText);
            }
          }
        },
        (error) => {
          console.warn(error);
        }
      );

      scannerRef.current = scanner;
    }, 500);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [navigate, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-3xl w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">Scan Student QR</h2>
        <div id="qr-reader" className="w-full"></div>
      </div>
    </div>
  );
}
