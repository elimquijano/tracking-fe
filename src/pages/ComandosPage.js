import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  ButtonBase,
  Stack,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { getTraccar, postTraccar } from "../utils/common";
import { confirmSwal, notificationSwal } from "../utils/swal-helpers";

// Icons
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import KeyOffIcon from "@mui/icons-material/KeyOff";
import KeyIcon from "@mui/icons-material/Key";
import DirectionsCarFilledIcon from "@mui/icons-material/DirectionsCarFilled";

const CommandButton = styled(ButtonBase)(({ theme, color, disabled }) => ({
  width: "100%",
  height: "100%",
  minHeight: "160px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  border: `2px solid ${theme.palette[color].light}`,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette[color].main,
  transition: "all 0.3s ease-in-out",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: theme.shadows[6],
    backgroundColor: theme.palette.action.hover,
    "& .command-icon": {
      transform: "scale(1.1)",
    },
  },
  "&:active": {
    transform: "translateY(0)",
  },
  ...(disabled && {
    opacity: 0.7,
    pointerEvents: "none",
  }),
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "5px",
    background: `linear-gradient(90deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
  },
}));

const commands = [
  {
    label: "ACTIVAR ALARMA",
    icon: (
      <NotificationsActiveIcon className="command-icon" sx={{ fontSize: 56 }} />
    ),
    type: "alarmArm",
    color: "success",
    description: "Activa el sistema de alarma del vehículo",
  },
  {
    label: "DESACTIVAR ALARMA",
    icon: (
      <NotificationsOffIcon className="command-icon" sx={{ fontSize: 56 }} />
    ),
    type: "alarmDisarm",
    color: "warning",
    description: "Desactiva el sistema de alarma del vehículo",
  },
  {
    label: "BLOQUEAR MOTOR",
    icon: <KeyOffIcon className="command-icon" sx={{ fontSize: 56 }} />,
    type: "engineStop",
    color: "error",
    description: "Bloquea el encendido del motor",
  },
  {
    label: "DESBLOQUEAR MOTOR",
    icon: <KeyIcon className="command-icon" sx={{ fontSize: 56 }} />,
    type: "engineResume",
    color: "primary",
    description: "Permite el encendido del motor",
  },
];

export const ComandosPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    const getDispositivoDetails = async () => {
      try {
        const response = await getTraccar(`devices/${id}`);
        setDevice(response.data);
      } catch (error) {
        notificationSwal(
          "Error",
          "No se pudo cargar la información del dispositivo. Por favor, intente de nuevo.",
          "error"
        );
        navigate("/dashboard/transporte/mapa");
      } finally {
        setLoading(false);
      }
    };
    getDispositivoDetails();
  }, [id, navigate]);

  const handleSendCommand = async (command) => {
    const userConfirmed = await confirmSwal(
      `Confirmar ${command.label.toLowerCase()}?`,
      `Se enviará el comando al vehículo ${device?.name || ""}.
      ${command.description}. ¿Desea continuar?`,
      {
        confirmButtonText: "Sí, enviar comando",
        confirmButtonColor: theme.palette[command.color].main,
        icon: "warning",
      }
    );

    if (userConfirmed) {
      setSending(command.type);
      try {
        await postTraccar("commands/send", {
          deviceId: parseInt(id),
          type: command.type,
        });
        notificationSwal(
          "Éxito",
          `Comando '${command.label}' enviado correctamente al vehículo ${device?.name}.`,
          "success"
        );
      } catch (error) {
        notificationSwal(
          "Error",
          `No se pudo enviar el comando. ${error?.message || ""}`,
          "error"
        );
      } finally {
        setSending(null);
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Cargando información del vehículo...
        </Typography>
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="lg">
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 4 },
          mt: 3,
          borderRadius: 3,
          background: theme.palette.background.default,
          minHeight: "70vh",
        }}
      >
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box sx={{ textAlign: "center", mb: 2 }}>
            {!isMobile && (
              <DirectionsCarFilledIcon
                sx={{
                  fontSize: 60,
                  color: theme.palette.primary.main,
                  mb: 1,
                }}
              />
            )}
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              Panel de Control
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Vehículo: <strong>{device?.name || "Desconocido"}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ID del dispositivo: {id}
            </Typography>
          </Box>

          <Grid container spacing={isMobile ? 2 : 3} sx={{ pt: 1, pb: 3 }}>
            {commands.map((command) => (
              <Grid item xs={6} md={3} key={command.type}>
                <CommandButton
                  color={command.color}
                  disabled={sending === command.type}
                  onClick={() => handleSendCommand(command)}
                >
                  {sending === command.type ? (
                    <Stack spacing={2} alignItems="center">
                      <CircularProgress
                        color={command.color}
                        size={30}
                        thickness={5}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Enviando...
                      </Typography>
                    </Stack>
                  ) : (
                    <>
                      <Box
                        sx={{
                          transition: "transform 0.3s ease",
                          mb: 1,
                        }}
                      >
                        {command.icon}
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.1rem",
                          letterSpacing: 0.5,
                        }}
                      >
                        {command.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          px: 1,
                          textAlign: "center",
                        }}
                      >
                        {command.description}
                      </Typography>
                    </>
                  )}
                </CommandButton>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.disabled">
              Todos los comandos son irreversibles una vez enviados
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};
