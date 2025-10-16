"use client";

import React, { createContext, useContext, ReactNode } from "react";

// Create the context with a default value
interface DemoModeContextType {
    isDemoMode: boolean;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

// Provider component
interface DemoModeProviderProps {
    children: ReactNode;
    isDemoMode: boolean;
}

export function DemoModeProvider({ children, isDemoMode }: DemoModeProviderProps) {
    return <DemoModeContext.Provider value={{ isDemoMode }}>{children}</DemoModeContext.Provider>;
}

// Hook to use the context
export function useDemoMode() {
    const context = useContext(DemoModeContext);
    if (context === undefined) {
        throw new Error("useDemoMode must be used within a DemoModeProvider");
    }
    return context;
}
