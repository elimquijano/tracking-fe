import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  ButtonBase,
  Icon,
  Stack,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { getTraccar, postTraccar } from '../utils/common';
import { confirmSwal, notificationSwal } from '../utils/swal-helpers';

// Icons
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import KeyOffIcon from '@mui/icons-material/KeyOff';
import KeyIcon from '@mui/icons-material/Key';

const CommandButton = styled(ButtonBase)(({ theme }) => ({
  width: '100%',
  height: '150px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
    backgroundColor: theme.palette.action.hover,
  },
}));

const commands = [
  {
    label: 'Activar Alarma',
    icon: <NotificationsActiveIcon sx={{ fontSize: 48 }} />,
    type: 'alarmArm',
    color: 'success',
  },
  {
    label: 'Desactivar Alarma',
    icon: <NotificationsOffIcon sx={{ fontSize: 48 }} />,
    type: 'alarmDisarm',
    color: 'warning',
  },
  {
    label: 'Bloquear Motor',
    icon: <KeyOffIcon sx={{ fontSize: 48 }} />,
    type: 'engineStop',
    color: 'error',
  },
  {
    label: 'Desbloquear Motor',
    icon: <KeyIcon sx={{ fontSize: 48 }} />,
    type: 'engineResume',
    color: 'primary',
  },
];

export const ComandosPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null); // Holds the type of command being sent

  useEffect(() => {
    const getDispositivoDetails = async () => {
      try {
        const response = await getTraccar(`devices/${id}`);
        setDevice(response.data);
      } catch (error) {
        notificationSwal('Error',
          'No se pudo cargar la información del dispositivo. Por favor, intente de nuevo.',
          'error');
        navigate('/dashboard/transporte/mapa');
      } finally {
        setLoading(false);
      }
    };
    getDispositivoDetails();
  }, [id, navigate]);

  const handleSendCommand = async (command) => {
    const userConfirmed = await confirmSwal(
      `¿Confirmar ${command.label}?`,
      `Se enviará el comando al vehículo ${device?.name || ''}. Esta acción no se puede deshacer.`,
      {
        confirmButtonText: 'Sí, enviar comando',
        icon: 'warning',
      }
    );

    if (userConfirmed) {
      setSending(command.type);
      try {
        await postTraccar('commands/send', { deviceId: parseInt(id), type: command.type });
        notificationSwal('Éxito',
          `Comando '${command.label}' enviado correctamente.`,
          'success');
      } catch (error) {
        notificationSwal('Error',
          `No se pudo enviar el comando. ${error?.message || ''}`,
          'error');
      } finally {
        setSending(null);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <Paper sx={{ p: { xs: 2, md: 4 }, mt: 3 }}>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h4" component="h1" gutterBottom>
            Panel de Comandos
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Vehículo: <strong>{device?.name || 'Desconocido'}</strong>
          </Typography>
          <Grid container spacing={3} sx={{ pt: 3 }}>
            {commands.map((command) => (
              <Grid item xs={12} sm={6} md={3} key={command.type}>
                <CommandButton
                  onClick={() => handleSendCommand(command)}
                  disabled={sending === command.type}
                >
                  {sending === command.type ? (
                    <CircularProgress />
                  ) : (
                    <Stack spacing={1} alignItems="center">
                      <Icon color={command.color} sx={{ fontSize: 64 }}>{command.icon}</Icon>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {command.label}
                      </Typography>
                    </Stack>
                  )}
                </CommandButton>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};
