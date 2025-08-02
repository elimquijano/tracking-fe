import { Marker } from "react-leaflet";
import { useEffect, useRef } from "react";
import "leaflet-rotatedmarker";

function RotatedMarker({
  position,
  icon,
  rotationAngle,
  rotationOrigin,
  eventHandlers,
  children,
  title,
}) {
  const markerRef = useRef();

  // Aplicar rotación después de que el marcador se monte
  useEffect(() => {
    if (markerRef.current && rotationAngle !== undefined) {
      const leafletMarker = markerRef.current;
      leafletMarker.setRotationAngle(rotationAngle);
      if (rotationOrigin) {
        leafletMarker.setRotationOrigin(rotationOrigin);
      }
    }
  }, [rotationAngle, rotationOrigin]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      eventHandlers={eventHandlers}
      title={title}
    >
      {children}
    </Marker>
  );
}

export default RotatedMarker;
