import * as React from "react";
import { useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Modal,
  TextField,
  Box,
  Grid,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  delTraccar,
  getTraccar,
  postTraccar,
  updateTraccar,
} from "../utils/common";
import { confirmSwal, notificationSwal } from "../utils/swal-helpers";
import { useAuth } from "../contexts/AuthContext";

const columns = [
  { id: "name", label: "NOMBRE", minWidth: 170, key: 1 },
  { id: "uniqueId", label: "NÚMERO DE WHATSAPP", minWidth: 170, key: 2 },
];

export default function ConductoresPage() {
  const { hasPermission } = useAuth();
  const namePage = "Conductor";
  const [drivers, setDrivers] = useState([]);
  const [searchFilter, setSearchFilter] = useState({});
  const [filteredRows, setFilteredRows] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    uniqueId: "",
  });

  const fetchData = async () => {
    try {
      const result = await getTraccar("/drivers");
      if (result.status === 200) {
        setDrivers(result.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredRows(drivers);
    setTotalItems(drivers.length);
  }, [drivers]);

  const filtrarLista = (lista, filtro) => {
    return lista.filter((item) => {
      for (const key in filtro) {
        if (Object.prototype.hasOwnProperty.call(filtro, key)) {
          if (!Object.prototype.hasOwnProperty.call(item, key)) {
            return false;
          }
          const filtroValor = filtro[key];
          const itemValor = item[key];
          if (
            typeof filtroValor === "string" &&
            typeof itemValor === "string"
          ) {
            if (!itemValor.toLowerCase().includes(filtroValor.toLowerCase())) {
              return false;
            }
          } else if (itemValor != filtroValor) {
            return false;
          }
        }
      }
      return true;
    });
  };

  const SearchFilter = () => {
    try {
      const datosFiltrados = filtrarLista(drivers, searchFilter);
      setFilteredRows(datosFiltrados);
      setTotalItems(datosFiltrados.length);
    } catch (error) {
      notificationSwal("error", error.message);
    }
  };

  const CleanFilter = () => {
    setFilteredRows([]);
    setSearchFilter({});
    setTotalItems(0);
  };

  const handleSearchChange = (event) => {
    const { name, value } = event.target;
    const cleanedValue = value.trim();
    setSearchFilter((prevSearch) => ({
      ...prevSearch,
      [name]: cleanedValue,
    }));
  };

  const handleEliminar = async (row) => {
    const confirmUser = await confirmSwal(
      "¿Estás seguro?",
      "Esta acción no se puede deshacer.",
      {
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      }
    );

    if (confirmUser) {
      const elementoId = row.id;
      try {
        await delTraccar("/drivers/" + elementoId);
        fetchData();
        notificationSwal("success", "Elemento eliminado correctamente");
      } catch (error) {
        notificationSwal("error", error.message);
        console.error("Error al eliminar el elemento:", error);
      }
    }
  };

  const handleOpenDialog = (driver) => {
    if (driver) {
      setEditingUser(driver);
      setFormData({
        id: driver.id,
        name: driver.name,
        uniqueId: driver.uniqueId,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        uniqueId: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await updateTraccar("/drivers/" + editingUser.id, formData);
        notificationSwal(
          "¡Usuario Actualizado!",
          "El usuario ha sido actualizado exitosamente.",
          "success"
        );
      } else {
        await postTraccar("/drivers", formData);
        notificationSwal(
          "¡Usuario Creado!",
          "El nuevo usuario ha sido creado exitosamente.",
          "success"
        );
      }
      fetchData();
    } catch (error) {
      console.error("Error al guardar el usuario:", error);
      notificationSwal(
        "¡Error!",
        error?.response?.data?.message ||
          "Hubo un problema al guardar el usuario.",
        "error"
      );
    } finally {
      handleCloseDialog();
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {hasPermission("drivers.create") && (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: "linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)",
              }}
            >
              Registrar {namePage}
            </Button>
          )}
        </Grid>
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={4}>
              <Box sx={{ mb: 1 }}>
                <label>Nombre:</label>
              </Box>
              <TextField
                type="text"
                name="name"
                value={searchFilter.name || ""}
                onChange={handleSearchChange}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <Box sx={{ mb: 1 }}>
                <label>Número de Whatsapp:</label>
              </Box>
              <TextField
                type="text"
                name="uniqueId"
                value={searchFilter.uniqueId || ""}
                onChange={handleSearchChange}
                size="small"
                fullWidth
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={3}>
          <Grid container spacing={2} direction="column">
            <Grid item>
              <Button
                variant="contained"
                color="success"
                startIcon={<SearchIcon />}
                onClick={SearchFilter}
                fullWidth
              >
                Buscar
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="error"
                startIcon={<CleaningServicesIcon />}
                onClick={CleanFilter}
                fullWidth
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Paper sx={{ width: "100%", overflow: "hidden", mt: 2 }}>
        {totalItems > 0 ? (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.label}
                    </TableCell>
                  ))}
                  <TableCell align="center">ACCIÓN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align}>
                        {row[column.id] || ""}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      {hasPermission("drivers.edit") && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(row)}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      {hasPermission("drivers.delete") && (
                        <IconButton
                          size="small"
                          onClick={() => handleEliminar(row)}
                          sx={{ ml: 1 }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="warning">No se encontraron resultados.</Alert>
        )}
      </Paper>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? "Editar Usuario" : "Agregar Usuario"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Whatsapp"
                type="number"
                value={formData.uniqueId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    uniqueId: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            disabled={!formData.name || !formData.uniqueId}
            sx={{
              background: "linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)",
            }}
          >
            {editingUser ? "Editar" : "Crear"} Usuario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
