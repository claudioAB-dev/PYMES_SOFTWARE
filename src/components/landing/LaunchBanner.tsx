"use client";

import { useState } from "react";
import { X, Rocket } from "lucide-react";

export function LaunchBanner() {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div className="relative bg-gradient-to-r from-[--primary] to-[--color-accent] text-white">
            <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium">
                <Rocket className="h-4 w-4 shrink-0" />
                <p className="text-center">
                    <span className="font-bold">Lanzamiento Abril 2025</span>
                    <span className="hidden sm:inline">
                        {" "}— Los primeros 20 clientes acceden con precio de fundadores bloqueado.
                    </span>
                    <span className="sm:hidden">
                        {" "}— Precio de fundadores para los primeros 20.
                    </span>
                </p>
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors"
                    aria-label="Cerrar banner"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
