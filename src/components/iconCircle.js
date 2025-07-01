import React from 'react';
import {
  Commute,
  Construction,
  DirectionsBike,
  DirectionsBoat,
  DirectionsBus,
  DirectionsCar,
  Flight,
  Person,
  Pets,
  Room,
  RvHookup,
  Train,
  Tram,
  TwoWheeler
} from '@mui/icons-material';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

const iconMapping = {
  default: Room,
  animal: Pets,
  bicycle: DirectionsBike,
  boat: DirectionsBoat,
  bus: DirectionsBus,
  car: DirectionsCar,
  camper: RvHookup,
  crane: Construction,
  helicopter: Flight,
  motorcycle: TwoWheeler,
  offroad: DirectionsCar,
  person: Person,
  pickup: DirectionsCar,
  plane: Flight,
  ship: DirectionsBoat,
  tractor: Construction,
  train: Train,
  tram: Tram,
  trolleybus: DirectionsBus,
  truck: DirectionsCar,
  van: Commute,
  scooter: TwoWheeler
};

function getIcon(id) {
  const IconComponent = iconMapping[id] || Room; // Room es un ícono por defecto si no se encuentra el ID
  return <IconComponent />;
}

export const IconCircle = ({ icon, color = 'primary' }) => {
  const theme = useTheme();

  const getColors = () => {
    switch (color) {
      case 'primary':
        return { background: theme.palette.primary.light, textColor: theme.palette.primary.main };
      case 'secondary':
        return { background: theme.palette.secondary.light, textColor: theme.palette.secondary.main };
      default:
        return { background: theme.palette.primary.light, textColor: theme.palette.primary.main };
    }
  };

  const { background, textColor } = getColors();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: background,
        color: textColor
      }}
    >
      {getIcon(icon)}
    </Box>
  );
};
