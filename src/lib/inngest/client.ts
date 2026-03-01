import { EventSchemas, Inngest } from "inngest";

// Definimos el payload que Inngest espera para el evento de finalización de descarga masiva
type SatDownloadCompletedEvent = {
    data: {
        satRequestId: string;
        organizationId: string;
        zipUrl: string;
    };
};

type Events = {
    "sat/download.completed": SatDownloadCompletedEvent;
};

// Inicializamos el cliente de Inngest con el ID del proyecto y los esquemas de eventos
export const inngest = new Inngest({
    id: "axioma",
    schemas: new EventSchemas().fromRecord<Events>()
});
