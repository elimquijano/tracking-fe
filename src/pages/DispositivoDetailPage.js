import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Container,
  Paper,
  Autocomplete,
  FormControl,
  Select,
  Chip,
  InputLabel,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { getTraccar } from "../utils/common";
import { theme } from "../theme/theme";

const categorias = [
  { id: "default", name: "Predeterminado" },
  { id: "animal", name: "Animal" },
  { id: "bicycle", name: "Bicicleta" },
  { id: "boat", name: "Barco" },
  { id: "bus", name: "Autobús" },
  { id: "car", name: "Automóvil" },
  { id: "camper", name: "Camper" },
  { id: "crane", name: "Grúa" },
  { id: "helicopter", name: "Helicóptero" },
  { id: "motorcycle", name: "Motocicleta" },
  { id: "offroad", name: "Todo terreno" },
  { id: "person", name: "Persona" },
  { id: "pickup", name: "Camioneta" },
  { id: "plane", name: "Avión" },
  { id: "ship", name: "Barco" },
  { id: "tractor", name: "Tractor" },
  { id: "train", name: "Tren" },
  { id: "tram", name: "Tranvía" },
  { id: "trolleybus", name: "Trolebús" },
  { id: "truck", name: "Camión" },
  { id: "van", name: "Furgoneta" },
  { id: "scooter", name: "Moto" },
];

export const DispositivoDetailPage = () => {
  const { id } = useParams();
  const [device, setDevice] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [driversIds, setDriversIds] = useState([]);

  useEffect(() => {
    const getDispositivoDetails = async () => {
      try {
        const response = await getTraccar(`devices/${id}`);
        setDevice(response.data);
      } catch (error) {
        console.error("Error fetching device details:", error);
      }
    };
    const getDrivers = async () => {
      try {
        const response = await getTraccar("drivers");
        setDrivers(response.data);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };
    const getDriverDevice = async () => {
      try {
        const response = await getTraccar(`drivers?deviceId=${id}`);
        setDriversIds(response.data.map((driver) => driver.id));
      } catch (error) {
        console.error("Error fetching driver-device associations:", error);
      }
    };
    getDispositivoDetails();
    getDrivers();
    getDriverDevice();
  }, [id]);

  useEffect(() => {
    const selectedDrivers = drivers.filter((driver) =>
      driversIds.includes(driver.id)
    );
    const uniqueIds = selectedDrivers
      .map((driver) => driver.uniqueId)
      .join(",");
    setDevice((prev) => ({
      ...prev,
      contact: uniqueIds,
    }));
  }, [driversIds]);
  return (
    <Container component="main" maxWidth="sm">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Detalles del Dispositivo
        </Typography>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            label="Nombre"
            value={device?.name || ""}
            onChange={(e) =>
              setDevice((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
          <TextField
            margin="normal"
            fullWidth
            label="Limite de Velocidad(km/h)"
            type="number"
            value={device?.attributes?.speedLimit * 1.852 || ""}
            onChange={(e) =>
              setDevice((prev) => ({
                ...prev,
                attributes: {
                  ...prev.attributes,
                  speedLimit: e.target.value / 1.852 || 0,
                },
              }))
            }
          />
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <Autocomplete
              multiple
              id="drivers-autocomplete"
              options={drivers}
              value={drivers.filter((driver) => driversIds.includes(driver.id))}
              onChange={(event, newValue) => {
                setDriversIds(newValue.map((driver) => driver.id));
              }}
              getOptionLabel={(option) => option.name}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option.id}
                    label={option.name}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Conductores" />
              )}
            />
          </FormControl>
          <TextField
            margin="normal"
            fullWidth
            label="Números de Whatsapp(separados por coma)"
            value={device?.contact || ""}
            onChange={(e) =>
              setDevice((prev) => ({
                ...prev,
                contact: e.target.value,
              }))
            }
            placeholder="9XXXXXXXX,9XXXXXXXX,..."
          />
          <Autocomplete
            options={categorias}
            getOptionLabel={(option) => option.name}
            onChange={(event, newValue) => {
              setDevice({
                ...device,
                category: newValue ? newValue.id : "",
              });
            }}
            value={
              categorias.find((category) => category.id === device.category) ||
              null
            }
            renderInput={(params) => (
              <TextField {...params} label="Categoría" />
            )}
            sx={{ mt: 2, mb: 2 }}
          />
          <Box
            sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 2 }}
          >
            <Button variant="contained" sx={{ backgroundColor: "#757072ff" }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: theme.palette.primary.main }}
            >
              Guardar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
