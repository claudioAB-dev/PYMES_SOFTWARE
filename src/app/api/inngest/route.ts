import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processMassiveSatDownload } from "@/lib/inngest/functions/sat-processor";

// Creamos los handlers de Inngest para nuestra API Route de Next.js
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        processMassiveSatDownload
    ],
});
