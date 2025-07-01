import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { GOOGLE_MAPS_API_KEY } from '../utils/common';

const GoogleStreetView = ({ latitude, longitude, heading }) => {
  const streetViewRef = useRef(null);

  useEffect(() => {
    const loadStreetView = () => {
      new window.google.maps.StreetViewPanorama(streetViewRef.current, {
        position: { lat: latitude, lng: longitude },
        pov: {
          heading: heading,
          pitch: 0
        },
        zoom: 1
      });
    };

    if (window.google) {
      loadStreetView();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.onload = loadStreetView;
      document.body.appendChild(script);
    }
  }, [latitude, longitude, heading]);

  return (
    <Box
      ref={streetViewRef}
      sx={{
        width: '100%',
        height: {
          xs: 180, // Altura para pantallas pequeñas
          md: 400 // Altura para pantallas grandes
        }
      }}
    />
  );
};

export default GoogleStreetView;
