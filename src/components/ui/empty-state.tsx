import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-4">
                <Icon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
                {description}
            </p>
            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
}
