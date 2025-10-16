import React from "react";

export async function renderComponentToHtml(Component: React.ComponentType<any>, props: any = {}): Promise<string> {
    try {
        // Dynamic import to ensure this only runs on server
        const { renderToString } = await import("react-dom/server");

        // Create element and render to string
        const element = React.createElement(Component, props);
        return renderToString(element);
    } catch (error) {
        console.error("Error rendering component to HTML:", error);
        throw new Error("Failed to render component to HTML");
    }
}
