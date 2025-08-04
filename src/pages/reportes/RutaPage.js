import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getTraccar } from '../../utils/common';
import { notificationSwal } from '../../utils/swal-helpers';
import { exportToExcel } from '../../utils/exportToExcel';
import { columnsReportTraccarRuta } from '../../utils/ExportColumns';

const columns = [
  { id: 'deviceId', label: 'VEHICULO', minWidth: 170, key: 1 },
  { id: 'fixTime', label: 'HORA FIJO', minWidth: 170, key: 1 },
  { id: 'latitude', label: 'LATITUD', minWidth: 170, key: 1 },
  { id: 'longitude', label: 'LONGITUD', minWidth: 170, key: 1 },
  { id: 'speed', label: 'VELOCIDAD', minWidth: 170, key: 1 },
  { id: 'address', label: 'DIRECCION', minWidth: 170, key: 1 },
  { id: 'course', label: 'RUMBO', minWidth: 170, key: 1 },
  { id: 'altitude', label: 'ALTITUD', minWidth: 170, key: 1 },
  { id: 'valid', label: 'VALIDO', minWidth: 170, key: 1 },
  { id: 'protocol', label: 'PROTOCOLO', minWidth: 170, key: 1 },
  { id: 'serverTime', label: 'HORA SERVIDOR', minWidth: 170, key: 1 },
  { id: 'deviceTime', label: 'HORA DISPOSITIVO', minWidth: 170, key: 1 },
  { id: 'geofenceIds', label: 'GEOCERCA', minWidth: 170, key: 1 },
  { id: 'distance', label: 'DISTANCIA', minWidth: 170, key: 1 },
  { id: 'totalDistance', label: 'DISTANCIA TOTAL', minWidth: 170, key: 1 },
  { id: 'motion', label: 'MOVIMIENTO', minWidth: 170, key: 1 },
  { id: 'accuracy', label: 'PRECISION', minWidth: 170, key: 1 }
];

const MostarCalle = ({ row }) => {
  const [calle, setCalle] = useState('');

  const handleClick = async () => {
    try {
      const response = await getTraccar(`server/geocode?latitude=${row.latitude}&longitude=${row.longitude}`);
      if (response) {
        setCalle(response.data);
      } else {
        setCalle('No se pudo obtener la dirección');
      }
    } catch (error) {
      console.error('Error fetching street data:', error);
      setCalle('Error al obtener la dirección');
    }
  };

  return (
    <>
      {calle ? (
        <div>{calle}</div>
      ) : (
        <Button onClick={handleClick} variant="outlined" size="small">
          Mostrar Calle
        </Button>
      )}
    </>
  );
};

export default function RutaPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [geocercas, setGeocercas] = useState([]);
  const [searchFilter, setSearchFilter] = useState({ date_filter: 'today' });
  const [data, setData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const result = await getTraccar('/devices');
        if (result.status === 200) {
          setVehiculos(result.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const fetchGeocercas = async () => {
      try {
        const result = await getTraccar('/geofences');
        if (result.status === 200) {
          setGeocercas(result.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchVehiculos();
    fetchGeocercas();
  }, []);

  async function SearchFilter() {
    if (!searchFilter.deviceId && !searchFilter.groupId) {
      notificationSwal('error', 'Debe seleccionar un dispositivo o un grupo');
      return;
    }
    const { from, to } = calculateDateRange(searchFilter.date_filter);
    try {
      const result = await getTraccar(
        '/reports/route' +
          construirUrl({
            ...searchFilter,
            from: from,
            to: to,
            from_date: undefined,
            to_date: undefined
          })
      );
      if (result.status === 200) {
        const dataParsed = result.data.map((item) => ({
          ...item,
          fixTime: restarCincoHoras(item.fixTime),
          deviceId: vehiculos.find((vehiculo) => vehiculo.id === item.deviceId)?.name,
          geofenceIds:
            item.geofenceIds?.length === 0
              ? 'Sin geocerca'
              : item.geofenceIds
                  ?.map((geofenceId) => geocercas.find((geofence) => geofence.id === geofenceId)?.name)
                  .join(', ') || '',
          speed: (item.speed * 1.852).toFixed(2) + ' km/h',
          deviceTime: restarCincoHoras(item.deviceTime),
          serverTime: restarCincoHoras(item.serverTime),
          motion: item.attributes.motion ? 'Sí' : 'No',
          totalDistance: (item.attributes.totalDistance / 1000).toFixed(2) + ' km',
          distance: item.attributes.distance ? (item.attributes.distance / 1000).toFixed(2) + ' km' : '0 km',
          valid: item.valid ? 'Sí' : 'No'
        }));
        setData(dataParsed);
        if (dataParsed.length === 0) {
          notificationSwal('info', 'No se encontraron datos');
        }
      }
    } catch (error) {
      notificationSwal('error', error.message);
    }
  }

  useEffect(() => {
    setTotalItems(data.length);
  }, [data]);

  const construirUrl = (params) => {
    const queryParts = [];
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    }
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  };

  function CleanFilter() {
    setData([]);
    setSearchFilter({ date_filter: 'today', from_date: '', to_date: '' });
  }

  const handleSearchChange = (event) => {
    const { name, value } = event.target;
    setSearchFilter((prevSearch) => ({
      ...prevSearch,
      [name]: value
    }));
  };

  const ExportFilter = async () => {
    try {
      const dataParse = data.map((item) => ({
        ...item
      }));
      exportToExcel(dataParse, columnsReportTraccarRuta, 'Ruta');
    } catch (error) {
      console.error('Error al exportar los datos:', error);
    }
  };

  const calculateDateRange = (dateFilter) => {
    const todayReference = new Date();
    let from, to;
    switch (dateFilter) {
      case 'today':
        from = new Date(todayReference);
        from.setHours(0, 0, 0, 0);
        to = new Date(todayReference);
        to.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        from = new Date(todayReference);
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        from = new Date(todayReference);
        from.setDate(from.getDate() - (from.getDay() || 7) + 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(to.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      case 'prev_week':
        from = new Date(todayReference);
        from.setDate(from.getDate() - (from.getDay() || 7) + 1 - 7);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(to.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        from = new Date(todayReference.getFullYear(), todayReference.getMonth(), 1);
        to = new Date(todayReference.getFullYear(), todayReference.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'prev_month':
        from = new Date(todayReference.getFullYear(), todayReference.getMonth() - 1, 1);
        to = new Date(todayReference.getFullYear(), todayReference.getMonth(), 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        from = new Date(searchFilter.from_date);
        to = new Date(searchFilter.to_date);
        break;
      default:
        from = new Date(todayReference);
        from.setHours(0, 0, 0, 0);
        to = new Date(todayReference);
        to.setHours(23, 59, 59, 999);
    }
    return {
      from: from.toISOString(),
      to: to.toISOString()
    };
  };

  const restarCincoHoras = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      const formatter = new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      return formatter.format(date);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error en fecha';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={4}>
              <Box sx={{ mb: 1 }}>
                <label>Vehículo:</label>
              </Box>
              <Autocomplete
                size="small"
                options={vehiculos}
                getOptionLabel={(option) => option.name}
                onChange={(event, newValue) => {
                  setSearchFilter({ ...searchFilter, deviceId: newValue ? newValue.id : '' });
                }}
                value={vehiculos.find((d) => d.id === searchFilter.deviceId) || null}
                renderInput={(params) => <TextField {...params} />}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <Box sx={{ mb: 1 }}>
                <label>Periodo:</label>
              </Box>
              <TextField
                select
                name="date_filter"
                value={searchFilter.date_filter || ''}
                onChange={handleSearchChange}
                size="small"
                fullWidth
              >
                <MenuItem value="today">Hoy</MenuItem>
                <MenuItem value="yesterday">Ayer</MenuItem>
                <MenuItem value="this_week">Esta semana</MenuItem>
                <MenuItem value="prev_week">Semana Anterior</MenuItem>
                <MenuItem value="this_month">Este mes</MenuItem>
                <MenuItem value="prev_month">Mes Anterior</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
              </TextField>
            </Grid>
            {searchFilter.date_filter === 'custom' && (
              <>
                <Grid item xs={6} md={2}>
                  <Box sx={{ mb: 1 }}>
                    <label>Desde:</label>
                  </Box>
                  <TextField
                    type="datetime-local"
                    name="from_date"
                    value={searchFilter.from_date || ''}
                    onChange={handleSearchChange}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <Box sx={{ mb: 1 }}>
                    <label>Hasta:</label>
                  </Box>
                  <TextField
                    type="datetime-local"
                    name="to_date"
                    value={searchFilter.to_date || ''}
                    onChange={handleSearchChange}
                    size="small"
                    fullWidth
                  />
                </Grid>
              </>
            )}
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
                color="warning"
                startIcon={<DownloadIcon />}
                onClick={ExportFilter}
                fullWidth
              >
                Exportar
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
      <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
        {totalItems > 0 ? (
          <TableContainer>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align} sx={{ position: 'relative' }}>
                        {column.id === 'course' ? (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transform: `rotate(${row[column.id] + 90 || 0}deg)`
                            }}
                          >
                            <ArrowBackIcon color="secondary" />
                          </Box>
                        ) : column.id === 'address' ? (
                          <MostarCalle row={row} />
                        ) : (
                          row[column.id]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="warning">No se encontraron resultados.</Alert>
        )}
      </Paper>
    </Box>
  );
}
