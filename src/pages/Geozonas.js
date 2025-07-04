import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Polygon,
  Circle,
  ZoomControl,
  Polyline,
} from "react-leaflet";
import {
  TextField,
  IconButton,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Modal,
  Autocomplete,
  Button,
  Box,
  Dialog,
  DialogTitle,
  Typography,
  DialogContent,
  Grid,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Polyline as PolylineIcon,
  Circle as CircleIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close,
  Edit,
  AddCircleOutline,
  RemoveRedEye,
  DirectionsCar,
} from "@mui/icons-material";
import "leaflet/dist/leaflet.css";
import { confirmSwal, notificationSwal } from "../utils/swal-helpers";
import {
  delTraccar,
  getTraccar,
  postTraccar,
  updateTraccar,
} from "../utils/common";
import { Link } from "react-router-dom";

const columns = [
  { id: "name", label: "NOMBRE", minWidth: 10, key: 2 },
  { id: "description", label: "DESCRIPCION", minWidth: 10, key: 4 },
  { id: "attributes", label: "ATRIBUTOS", minWidth: 10, key: 5 },
];

const colores = [
  { id: "red", name: "Rojo" },
  { id: "blue", name: "Azul" },
  { id: "green", name: "Verde" },
  { id: "yellow", name: "Amarillo" },
  { id: "purple", name: "Morado" },
  { id: "orange", name: "Naranja" },
  { id: "pink", name: "Rosa" },
];

const Geozonas = () => {
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [circleCenter, setCircleCenter] = useState(null);
  const [drawingMode, setDrawingMode] = useState(null);
  const [undoPoints, setUndoPoints] = useState([]);
  const [redoPoints, setRedoPoints] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [itemSave, setItemSave] = useState({});
  const [openModal1, setOpenModal1] = useState(false);
  const [openModal2, setOpenModal2] = useState(false);
  const [editedItem, setEditedItem] = useState({});
  const [mapKey, setMapKey] = useState(0); // Nueva clave para forzar la re-renderización del mapa
  const [calendars, setCalendars] = useState([]);
  const [centerMap, setCenterMap] = useState([
    -9.935471539483416, -76.24764000722851,
  ]);
  const [zoomMap, setZoomMap] = useState(13);

  async function SearchFilter() {
    try {
      const result = await getTraccar("/geofences");
      setFilteredRows(result?.data);
    } catch (error) {
      console.error("Error al obtener las GeoZonas:", error);
      notificationSwal("Error", "Error al obtener las GeoZonas", "error");
    }
  }

  useEffect(() => {
    SearchFilter();
    const fetchCalendars = async () => {
      try {
        const result = await getTraccar("/calendars");
        setCalendars(result?.data);
        console.log(result?.data);
      } catch (error) {
        console.error("error", error);
      }
    };
    fetchCalendars();
  }, []);

  useEffect(() => {
    setTotalItems(filteredRows.length);
  }, [filteredRows]);

  const handleEditChange = (name, value) => {
    setEditedItem((prevEditedItem) => ({
      ...prevEditedItem,
      [name]: value,
    }));
  };

  async function updateItem() {
    const elementoId = editedItem.id;
    const updatedData = {
      id: editedItem.id,
      name: editedItem.name,
      description: editedItem.description,
      area: editedItem.area,
      calendarId: editedItem.calendarId || 0,
      attributes: {
        speedLimit: editedItem.speedLimit,
        color: editedItem.color,
        polylinedistance: editedItem.polylinedistance,
      },
    };
    try {
      const result = await updateTraccar(
        `/geofences/${elementoId}`,
        updatedData
      );
      if (result.status === 200) {
        notificationSwal(
          "Exito",
          "GeoZona actualizada correctamente",
          "success"
        );
        setFilteredRows((prevRows) => {
          return prevRows.map((row) => {
            if (row.id === elementoId) {
              return { ...row, ...updatedData };
            } else {
              return row;
            }
          });
        });
        setEditedItem({});
        setMapKey((prevKey) => prevKey + 1); // Forzar la re-renderización del mapa
      }
    } catch (error) {
      notificationSwal("Error", "Error al actualizar la GeoZona", "error");
      console.error("Error al actualizar la GeoZona:", error);
    } finally {
      handleCloseModal2();
    }
  }

  const handleSaveChange = (event) => {
    const { name, value } = event.target;
    setItemSave((prevSearch) => ({
      ...prevSearch,
      [name]: value,
    }));
  };

  function handleEditar(row) {
    const attributes = row.attributes || {};
    setEditedItem({
      id: row.id,
      name: row.name,
      description: row.description,
      area: row.area,
      speedLimit: attributes?.speedLimit,
      color: attributes?.color,
      polylinedistance: attributes?.polylinedistance,
    });
  }

  const handleCloseModal1 = () => {
    setOpenModal1(false);
  };

  const handleOpenModal2 = () => {
    setOpenModal2(true);
  };

  const handleCloseModal2 = () => {
    setOpenModal2(false);
  };

  const handleMapClick = (e) => {
    if (drawingMode === "polygon") {
      setPolygonPoints([...polygonPoints, e.latlng]);
      setUndoPoints([...undoPoints, polygonPoints]);
      setRedoPoints([]);
    } else if (drawingMode === "circle") {
      setCircleCenter(e.latlng);
      setOpenModal1(true);
    }
  };

  const handleSave = async () => {
    setOpenModal1(false);
    if (circleCenter && itemSave.radio) {
      const radiusInMeters = parseFloat(itemSave.radio);
      if (isNaN(radiusInMeters) || radiusInMeters <= 0) {
        notificationSwal(
          "Error",
          "El radio debe ser un número positivo",
          "error"
        );
        return;
      }
      const newGeoZone = {
        name: `GeoZona ${filteredRows.length + 1}`,
        area: `CIRCLE (${circleCenter.lat} ${circleCenter.lng}, ${radiusInMeters})`,
        attributes: {
          speedLimit: itemSave.speedLimit,
          color: itemSave.color,
          polylinedistance: itemSave.polylinedistance,
        },
      };
      try {
        const response = await postTraccar("/geofences", newGeoZone);
        if (response.status === 200) {
          notificationSwal("Exito", "GeoZona creada correctamente", "success");
          setCircleCenter(null);
          setDrawingMode(null);
          setItemSave({});
          setMapKey((prevKey) => prevKey + 1); // Forzar la re-renderización del mapa
          setFilteredRows([...filteredRows, response.data]);
        }
      } catch (error) {
        notificationSwal("Error", "Error al crear la GeoZona", "error");
        console.error("Error al crear la GeoZona:", error);
      }
    }
  };

  const handlePolygonComplete = async () => {
    const coordinates = polygonPoints
      .map((point) => `${point.lat} ${point.lng}`)
      .join(", ");
    const newGeoZone = {
      name: `GeoZona ${filteredRows.length + 1}`,
      area: `POLYGON ((${coordinates}))`,
    };
    try {
      const response = await postTraccar("/geofences", newGeoZone);
      if (response.status === 200) {
        notificationSwal("Exito", "GeoZona creada correctamente", "success");
        setFilteredRows([...filteredRows, response.data]);
        setPolygonPoints([]);
        setUndoPoints([]);
        setRedoPoints([]);
        setDrawingMode(null);
        setMapKey((prevKey) => prevKey + 1); // Forzar la re-renderización del mapa
      }
    } catch (error) {
      notificationSwal("error", "Error al crear la GeoZona");
      console.error("Error al crear la GeoZona:", error);
    }
  };

  const handleDeleteGeoZone = async (row) => {
    const isConfirmed = await confirmSwal(
      "Atención",
      `¿Estás seguro de que deseas eliminar la GeoZona ${row.name}?`,
      {
        confirmButtonText: "Sí, Eliminar",
        cancelButtonText: "Cancelar",
      }
    );

    if (isConfirmed) {
      try {
        await delTraccar(`/geofences/${row.id}`);
        notificationSwal(
          "Eliminado",
          `GeoZona ${row.name} ha sido eliminada correctamente`,
          "success"
        );
        setFilteredRows(
          filteredRows.filter((geoZone) => geoZone.id !== row.id)
        );
        setMapKey((prevKey) => prevKey + 1); // Forzar la re-renderización del mapa
      } catch (error) {
        notificationSwal("Error", "Error al eliminar la GeoZona", "error");
        console.error("Error al eliminar la GeoZona:", error);
      }
    }
  };

  const handleSetDrawingMode = (mode) => {
    setDrawingMode(mode);
    setPolygonPoints([]);
    setCircleCenter(null);
    setItemSave({});
    setUndoPoints([]);
    setRedoPoints([]);
  };

  const handleUndo = () => {
    if (undoPoints.length > 0) {
      const previousPoints = undoPoints[undoPoints.length - 1];
      setRedoPoints([...redoPoints, polygonPoints]);
      setPolygonPoints(previousPoints);
      setUndoPoints(undoPoints.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoPoints.length > 0) {
      const nextPoints = redoPoints[redoPoints.length - 1];
      setUndoPoints([...undoPoints, polygonPoints]);
      setPolygonPoints(nextPoints);
      setRedoPoints(redoPoints.slice(0, -1));
    }
  };

  const handleClearDrawing = () => {
    setPolygonPoints([]);
    setCircleCenter(null);
    setUndoPoints([]);
    setRedoPoints([]);
  };

  const handlePositionChange = (row) => {
    let point = null;
    if (String(row.area).includes("CIRCLE")) {
      point = parseCircle(row.area)?.center;
    } else if (String(row.area).includes("POLYGON")) {
      point = parsePolygon(row.area)?.points[0];
    } else if (String(row.area).includes("LINESTRING")) {
      point = parseLineString(row.area)?.points[0];
    }
    if (!point) {
      return; // Si no se puede parsear el área, no se hace nada
    }

    setCenterMap(point);
    setZoomMap(18);
    setMapKey((prevKey) => prevKey + 1); // Forzar la re-renderización del mapa
  };

  // Función para parsear un string de tipo CIRCLE
  function parseCircle(circleString) {
    const regex = /CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([\d.]+)\s*\)/;
    const match = circleString.match(regex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      const radius = parseFloat(match[3]);
      return { center: [lat, lng], radius };
    }
    return null;
  }

  // Función para parsear un string de tipo POLYGON
  function parsePolygon(polygonString) {
    const regex = /POLYGON\s*\(\(\s*([-\d.\s,]+)\s*\)\)/;
    const match = polygonString.match(regex);
    if (match) {
      const pointsString = match[1];
      const points = pointsString.split(",").map((point) => {
        const [lat, lng] = point.trim().split(/\s+/).map(parseFloat);
        return [lat, lng];
      });
      return { points };
    }
    return null;
  }

  // Función para parsear un string de tipo LINESTRING
  function parseLineString(lineString) {
    const regex = /LINESTRING\s*\(\s*([-\d.\s,]+)\s*\)/;
    const match = lineString.match(regex);
    if (match) {
      const pointsString = match[1];
      const points = pointsString.split(",").map((point) => {
        const [lat, lng] = point.trim().split(/\s+/).map(parseFloat);
        return [lat, lng];
      });
      return { points };
    }
    return null;
  }

  return (
    <Box sx={{ position: "relative" }}>
      <Paper sx={{ padding: "10px", overflow: "hidden" }}>
        <MapContainer
          key={mapKey} // Usar la clave para forzar la re-renderización del mapa
          center={centerMap}
          zoom={zoomMap}
          zoomControl={false}
          style={{
            height: "400px",
            width: "100%",
            cursor: drawingMode ? "crosshair" : "auto",
          }}
        >
          <TileLayer
            url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={["mt0", "mt1", "mt2", "mt3"]}
            maxZoom={20}
          />
          <MapEvents onClick={handleMapClick} />
          <ZoomControl position="bottomleft" />
          {polygonPoints.length > 0 && (
            <Polygon positions={polygonPoints} color="green" />
          )}
          {circleCenter && itemSave?.radio && (
            <Circle
              center={circleCenter}
              radius={itemSave?.radio}
              color={itemSave?.color || "red"}
            />
          )}
          {filteredRows.map((row, index) => {
            let type;
            let data;

            if (String(row.area).includes("CIRCLE")) {
              type = "CIRCLE";
              data = parseCircle(row.area);
            } else if (String(row.area).includes("POLYGON")) {
              type = "POLYGON";
              data = parsePolygon(row.area);
            } else if (String(row.area).includes("LINESTRING")) {
              type = "LINESTRING";
              data = parseLineString(row.area);
            }

            const color = row?.attributes?.color || "blue";
            if (type === "POLYGON") {
              return (
                <Polygon key={index} positions={data.points} color={color} />
              );
            } else if (type === "CIRCLE") {
              return (
                <Circle
                  key={index}
                  center={data.center}
                  radius={data.radius}
                  color={color}
                />
              );
            } else if (type === "LINESTRING") {
              return (
                <Polyline key={index} positions={data.points} color={color} />
              );
            }
            return null;
          })}
        </MapContainer>
      </Paper>
      <Paper
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          margin: "10px",
          display: "flex",
          gap: "10px",
        }}
      >
        <IconButton onClick={() => handleSetDrawingMode("polygon")}>
          <PolylineIcon />
        </IconButton>
        <IconButton onClick={() => handleSetDrawingMode("circle")}>
          <CircleIcon />
        </IconButton>
        {drawingMode === "polygon" && polygonPoints.length > 0 && (
          <>
            <IconButton onClick={handlePolygonComplete}>
              <CheckIcon />
            </IconButton>
            <IconButton onClick={handleUndo}>
              <UndoIcon />
            </IconButton>
            <IconButton onClick={handleRedo}>
              <RedoIcon />
            </IconButton>
            <IconButton onClick={handleClearDrawing}>
              <ClearIcon />
            </IconButton>
          </>
        )}
      </Paper>
      <Paper sx={{ width: "100%", overflow: "hidden", padding: "20px" }}>
        <TableContainer sx={{ maxHeight: 300, overflowY: "auto" }}>
          {totalItems > 0 ? (
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align}
                      style={{ minWidth: column.minWidth }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                  {/* Columna adicional para botones de acción */}
                  <TableCell align="center">ACCIONES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row, index) => {
                  return (
                    <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {typeof value === "object" && value !== null
                              ? JSON.stringify(value)
                              : value !== null
                              ? value
                              : ""}
                          </TableCell>
                        );
                      })}

                      {/* Columna de botones de acción */}
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handlePositionChange(row)}
                        >
                          <RemoveRedEye />
                        </Button>
                        <Button
                          component={Link}
                          to={`/dashboard/geozonas/${row.id}`} // La prop 'to' se pasa directamente al componente Link
                          variant="contained"
                          color="success"
                          aria-label={`Ver geozonas de ${row.name}`} // Es una buena práctica de accesibilidad
                        >
                          <DirectionsCar />
                        </Button>
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() => {
                            handleOpenModal2();
                            handleEditar(row);
                          }}
                        >
                          <EditIcon />
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDeleteGeoZone(row)}
                        >
                          <DeleteIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="alert alert-warning" role="alert">
              No se encontraron resultados.
            </div>
          )}
        </TableContainer>
      </Paper>

      <Dialog
        open={openModal1}
        onClose={handleCloseModal1}
        maxWidth="sm" // Controla el ancho máximo del diálogo
        fullWidth // Hace que el diálogo use el ancho máximo disponible
      >
        <DialogTitle>
          <Typography variant="h5" component="span">
            Registre una nueva GeoZona
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
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Usamos Grid para el layout de columnas */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Radio (en metros) (*)"
                type="number"
                name="radio"
                id="radio"
                value={itemSave.radio}
                onChange={handleSaveChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                size="small"
                options={colores}
                getOptionLabel={(option) => option.name}
                onChange={(event, newValue) => {
                  setItemSave({
                    ...itemSave,
                    color: newValue ? newValue.id : "",
                  });
                }}
                value={
                  colores.find((color) => color.id === itemSave.color) || null
                }
                renderInput={(params) => (
                  <TextField {...params} label="Color (*)" />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", p: 2 }}>
          <Button
            onClick={handleSave}
            variant="contained"
            color="info"
            startIcon={<AddCircleOutline />}
          >
            REGISTRAR
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openModal2}
        onClose={handleCloseModal2}
        maxWidth="md" // 'md' es bueno para formularios con más campos
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="span">
            Editar Geo-Zona
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseModal2}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers component="form" noValidate>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Fila 1 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Nombre (*)"
                name="name"
                value={editedItem.name || ""}
                onChange={(e) =>
                  handleEditChange(e.target.name, e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={editedItem.description || ""}
                onChange={(e) =>
                  handleEditChange(e.target.name, e.target.value)
                }
              />
            </Grid>

            {/* Fila 2 */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                size="small"
                options={calendars}
                getOptionLabel={(option) => option?.name || ""}
                onChange={(event, newValue) =>
                  handleEditChange("calendarId", newValue ? newValue.id : "")
                }
                value={
                  calendars.find((c) => c.id === editedItem.calendarId) || null
                }
                renderInput={(params) => (
                  <TextField {...params} label="Calendario" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                size="small"
                options={colores}
                getOptionLabel={(option) => option?.name || ""}
                onChange={(event, newValue) =>
                  handleEditChange("color", newValue ? newValue.id : "")
                }
                value={colores.find((c) => c.id === editedItem.color) || null}
                renderInput={(params) => (
                  <TextField {...params} label="Color" />
                )}
              />
            </Grid>

            {/* Fila 3 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Límite de Velocidad"
                name="speedLimit"
                type="number"
                value={editedItem.speedLimit || ""}
                onChange={(e) =>
                  handleEditChange(e.target.name, e.target.value)
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">Km/h</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Distancia de Polilínea"
                name="polylineDistance"
                type="number"
                value={editedItem.polylineDistance || ""}
                onChange={(e) =>
                  handleEditChange(e.target.name, e.target.value)
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">Km</InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", p: 2 }}>
          <Button
            onClick={updateItem}
            variant="contained"
            color="warning"
            startIcon={<Edit />}
            size="large"
          >
            ACTUALIZAR
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const MapEvents = ({ onClick }) => {
  useMapEvents({
    click: onClick,
  });
  return null;
};

export default Geozonas;