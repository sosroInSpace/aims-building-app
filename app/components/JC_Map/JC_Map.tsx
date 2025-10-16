"use client";

import styles from "./JC_Map.module.scss";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Image from "next/image";
import React, { useState } from "react";

export default function JC_Map(
    _: Readonly<{
        containerClassName?: string;
        initialPosition: google.maps.LatLngLiteral;
        initialZoom: number;
        positions?: { name?: string; lat: number; lng: number; mapsUrl?: string }[];
        showRefresh?: boolean;
    }>
) {
    const [gesture, setGesture] = useState<string>("auto");
    setTimeout(() => {
        // setGesture("greedy");
    }, 1000);

    let thePositions = _.positions;

    if (thePositions != null) {
        // Make sure lats/longs are numbers
        thePositions.forEach(p => {
            p.lat = Number(p.lat);
            p.lng = Number(p.lng);
        });
        // Sort by lat (we set the zIndex of each marker as index of item)
        thePositions = thePositions.sort((a, b) => (a.lat > b.lat ? 1 : -1));
    }

    const iconSize = 50;
    const icon: google.maps.Icon = {
        url: "/icons/MapsMarker.webp",
        scaledSize: { width: iconSize, height: iconSize * 1.4 } as google.maps.Size
    };

    // Map
    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <GoogleMap mapContainerClassName={`${styles.mapContainer} ${_.containerClassName != null ? _.containerClassName : ""}`} center={_.initialPosition} zoom={_.initialZoom} clickableIcons={false} options={{ gestureHandling: "greedy", minZoom: 7.5 }}>
                {_.showRefresh && <Image className={styles.mapRefreshButton} src="/icons/refresh.webp" width={0} height={0} alt="RefreshIcon" unoptimized />}
                {thePositions?.map((p, index) => (
                    <Marker key={`${p.lat}|${p.lng}`} position={{ lat: Number(p.lat), lng: Number(p.lng) }} title={p.name} icon={icon} onClick={p.mapsUrl != null ? () => window.open(p.mapsUrl, "_blank") : () => null} zIndex={index} />
                ))}
            </GoogleMap>
        </LoadScript>
    );
}
