import { useMap, Tooltip, Popup } from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-rotatedmarker";

function RotatedMarker({
  position,
  icon,
  rotationAngle,
  rotationOrigin,
  eventHandlers,
  children,
}) {
  const map = useMap();
  const markerRef = useRef();

  useEffect(() => {
    markerRef.current = L.marker(position, {
      icon: icon,
      rotationAngle: rotationAngle,
      rotationOrigin: rotationOrigin,
    }).addTo(map);

    // Añade los manejadores de eventos al marcador
    for (const event in eventHandlers) {
      markerRef.current.on(event, eventHandlers[event]);
    }

    // Añade los hijos al marcador
    if (children) {
      if (children.type === Tooltip) {
        markerRef.current.bindTooltip(children.props.children, children.props);
      } else if (children.type === Popup) {
        markerRef.current.bindPopup(children.props.children, children.props);
      }
      // Aquí puedes añadir más condiciones para otros tipos de hijos
    }

    return () => {
      map.removeLayer(markerRef.current);
    };
  }, [
    map,
    position,
    icon,
    rotationAngle,
    rotationOrigin,
    eventHandlers,
    children,
  ]);

  return null;
}

export default RotatedMarker;
