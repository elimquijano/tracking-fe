import * as React from "react";
import { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useParams } from "react-router";
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { confirmSwal, notificationSwal } from "../utils/swal-helpers";
import {
  delTraccarWithPayload,
  getTraccar,
  postTraccar,
} from "../utils/common";
import { Add } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const columns = [
  { id: "name", label: "NOMBRE", minWidth: 170, key: 1 },
  { id: "uniqueId", label: "IDENTIFICADOR", minWidth: 170, key: 1 },
];

export const DispositivosGeozonaPage = () => {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const namePage1 = "Dispositivos";
  const namePage2 = "Geozona";
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesGeozone, setVehiclesGeozone] = useState([]);
  const [searchFilter, setSearchFilter] = useState({});
  const [filteredRows, setFilteredRows] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selected, setSelected] = useState([]);
  const [openModal1, setOpenModal1] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const result = await getTraccar("/devices");
      if (result.status == 200) {
        setVehicles(result.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const checkVehicleGeofence = async (vehicle) => {
    // Validar entrada básica
    if (!vehicle || !vehicle.id || !id) {
      console.warn("Datos incompletos para checkVehicleGeofence:", {
        vehicle,
        id,
      });
      return null;
    }

    try {
      // Llama a tu función de API
      const result = await getTraccar(`/geofences?deviceId=${vehicle.id}`);

      // Valida la respuesta (ajusta según la estructura real de 'result')
      if (result && result.status === 200 && Array.isArray(result.data)) {
        const geozonas = result.data;
        // Busca la geocerca específica
        const targetGeofence = geozonas.find((item) => item.id === Number(id));
        if (targetGeofence) {
          // Éxito: devuelve el vehículo con la geocerca
          return vehicle;
        }
        // La geocerca específica no se encontró para este vehículo
        return null;
      } else {
        // Respuesta no válida de la API
        console.warn(
          `Respuesta inválida de API para vehículo ${vehicle.id}:`,
          result
        );
        return null;
      }
    } catch (error) {
      // Error durante la llamada a la API
      console.error(
        `Error fetching geofence for vehicle ${vehicle.id}:`,
        error
      );
      return null; // Devuelve null para que Promise.all no falle por completo
    }
  };

  // Función principal que orquesta las llamadas paralelas
  const fetchAllVehicleGeofences = async () => {
    // Si no hay vehículos o ID objetivo, limpiar estado y salir
    if (!vehicles || vehicles.length === 0 || !id) {
      return;
    }

    setLoading(true);
    // Crear un array de promesas, una por cada vehículo
    const promises = vehicles.map((vehicle) => checkVehicleGeofence(vehicle));

    try {
      // Ejecutar todas las promesas en paralelo y esperar resultados
      const results = await Promise.all(promises);
      const vehiclesInGeozone = results.filter((result) => result !== null);
      setVehiclesGeozone(vehiclesInGeozone);
    } catch (error) {
      // Error general en Promise.all (menos probable si los errores individuales se manejan)
      console.error("Error procesando geocercas para vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Ejecutar la función orquestadora
    fetchAllVehicleGeofences();
  }, [vehicles]);

  useEffect(() => {
    setFilteredRows(vehiclesGeozone);
  }, [vehiclesGeozone]);

  useEffect(() => {
    setTotalItems(filteredRows.length);
  }, [filteredRows]);

  function filtrarLista(lista, filtro) {
    return lista.filter((item) => {
      // Iterar sobre cada clave en el objeto filtro
      for (const key in filtro) {
        if (Object.prototype.hasOwnProperty.call(filtro, key)) {
          // Verificar si el item tiene la clave
          if (!Object.prototype.hasOwnProperty.call(item, key)) {
            return false;
          }

          const filtroValor = filtro[key];
          const itemValor = item[key];

          // Si el valor del filtro es una cadena, hacer una comparación insensible a mayúsculas y minúsculas
          if (
            typeof filtroValor === "string" &&
            typeof itemValor === "string"
          ) {
            if (!itemValor.toLowerCase().includes(filtroValor.toLowerCase())) {
              return false;
            }
          } else {
            // Si no es una cadena, hacer una comparación estricta
            if (itemValor != filtroValor) {
              return false;
            }
          }
        }
      }
      // Si no se ha retornado false hasta aquí, el item cumple con los criterios del filtro
      return true;
    });
  }

  async function SearchFilter() {
    let filter = searchFilter;
    try {
      const datosFiltrados = filtrarLista(vehiclesGeozone, filter);
      setFilteredRows(datosFiltrados);
    } catch (error) {
      notificationSwal("Error", "Error al filtrar los datos", "error");
    }
  }

  function CleanFilter() {
    setFilteredRows([]);
    setSearchFilter({});
  }

  function ValidacionItemSave(itemSave) {
    let response = true;
    let msgResponse = "";

    if (!itemSave || Object.keys(itemSave).length === 0) {
      msgResponse += "* Debe completar los campos obligatorios.<br>";
      response = false;
    } else {
      if (!itemSave.geofenceId) {
        msgResponse += "* Debe seleccionar una Geozona.<br>";
        response = false;
      }
      if (!itemSave.devices || Object.keys(itemSave.devices).length === 0) {
        msgResponse += "* Debe seleccionar un Producto.<br>";
        response = false;
      }
    }

    if (response === false) {
      notificationSwal("Error", msgResponse, "error");
    }

    return response;
  }

  async function SaveItem() {
    const itemSave = {
      geofenceId: id,
      devices: selected,
    };
    if (ValidacionItemSave(itemSave) === false) {
      return;
    }
    try {
      itemSave.devices.forEach(async (id) => {
        await postTraccar("/permissions", {
          deviceId: String(id),
          geofenceId: Number(itemSave.geofenceId),
        });
        setVehiclesGeozone((prevVehicles) => [
          ...prevVehicles,
          vehicles.find((item) => item.id === id),
        ]);
      });
      notificationSwal("Exito", "¡Registro exitoso!", "success");
      setSelected([]);
    } catch (e) {
      notificationSwal("Error", "Error al guardar el registro", "error");
    } finally {
      handleCloseModal1();
    }
  }

  const handleSelect = (id) => {
    setSelected((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id]
    );
  };

  const handleSearchChange = (event) => {
    const { name, value } = event.target;
    const cleanedValue = value.trim();
    setSearchFilter((prevSearch) => ({
      ...prevSearch,
      [name]: cleanedValue,
    }));
  };

  async function handleEliminar(row) {
    const isConfirmed = await confirmSwal(
      "¿Estás seguro?",
      "Una vez eliminado, no se puede deshacer.",
      {
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      }
    );

    if (isConfirmed) {
      const elementoId = row.id;
      try {
        await delTraccarWithPayload("/permissions", {
          deviceId: String(elementoId),
          geofenceId: Number(id),
        });
        notificationSwal(
          "Exito",
          "Elemento eliminado correctamente",
          "success"
        );
        setVehiclesGeozone((prevVehicles) =>
          prevVehicles.filter((vehicle) => vehicle.id !== elementoId)
        );
      } catch (error) {
        notificationSwal("Error", "Error al eliminar el elemento", "error");
        console.error("Error al eliminar el elemento:", error);
      }
    }
  }

  const handleOpenModal1 = () => {
    setOpenModal1(true);
  };

  const handleCloseModal1 = () => {
    setOpenModal1(false);
  };

  const unassignedVehicles = vehicles.filter(
    (v) => !filteredRows.some((assigned) => assigned.id === v.id)
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* SECCIÓN DE FILTROS Y ACCIÓN PRINCIPAL */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {hasPermission("geozonas.dispositivos.create") && (
          <Button
            startIcon={<Add />}
            onClick={handleOpenModal1}
            variant="contained"
            disabled={loading}
            sx={{
              alignSelf: "flex-start",
              background: "linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)",
            }}
          >
            Asignar {namePage1} a {namePage2}
          </Button>
        )}

        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={8}>
            <Grid container spacing={2} component="form">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="name"
                  value={searchFilter.name || ""}
                  onChange={handleSearchChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Identificador"
                  name="uniqueId"
                  value={searchFilter.uniqueId || ""}
                  onChange={handleSearchChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={SearchFilter}
                disabled={loading}
                startIcon={<SearchIcon />}
              >
                BUSCAR
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={CleanFilter}
                disabled={loading}
                startIcon={<CleaningServicesIcon />}
              >
                LIMPIAR
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      {/* SECCIÓN DE LA TABLA PRINCIPAL */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : totalItems > 0 ? (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader aria-label="tabla de asignaciones">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align}>
                      {column.label}
                    </TableCell>
                  ))}
                  <TableCell align="center">ACCIÓN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow hover key={row.id}>
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align}>
                        {row[column.id]}
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      {hasPermission("geozonas.dispositivos.delete") && (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleEliminar(row)}
                        >
                          <DeleteIcon />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="warning" sx={{ m: 2 }}>
            No se encontraron resultados.
          </Alert>
        )}
      </Paper>

      {/* MODAL DE ASIGNACIÓN */}
      <Dialog
        open={openModal1}
        onClose={handleCloseModal1}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Agregar {namePage1} a {namePage2}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseModal1}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selected.length > 0 &&
                        selected.length < unassignedVehicles.length
                      }
                      checked={
                        unassignedVehicles.length > 0 &&
                        selected.length === unassignedVehicles.length
                      }
                      onChange={() => {
                        if (selected.length === unassignedVehicles.length) {
                          setSelected([]);
                        } else {
                          setSelected(unassignedVehicles.map((row) => row.id));
                        }
                      }}
                    />
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align}>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {unassignedVehicles.map((row) => (
                  <TableRow
                    hover
                    key={row.id}
                    selected={selected.includes(row.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onChange={() => handleSelect(row.id)}
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align}>
                        {row[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", p: 2 }}>
          <Button
            onClick={SaveItem}
            variant="contained"
            color="info"
            startIcon={<AddCircleOutlineIcon />}
          >
            REGISTRAR
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
