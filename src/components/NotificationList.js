// material-ui
import { useTheme, styled } from '@mui/material/styles';
import {
  Avatar,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Typography
} from '@mui/material';

// styles
const ListItemWrapper = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  padding: 16,
  '&:hover': {
    background: theme.palette.background.default
  },
  '& .MuiListItem-root': {
    padding: 0
  }
}));

const NotificationList = ({ notifications = [] }) => {
  const theme = useTheme();

  const chipSX = {
    height: 24,
    padding: '0 6px'
  };
  const chipErrorSX = {
    ...chipSX,
    color: theme.palette.error.dark,
    backgroundColor: theme.palette.error.light,
    marginRight: '5px'
  };

  function obtenerTiempoRelativoModerno(fechaString) {
    // Formateador para español, se crea una sola vez idealmente
    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

    const AHORA = new Date();
    const fecha = new Date(fechaString.replace(' ', 'T'));

    const diferenciaEnSegundos = Math.round((fecha - AHORA) / 1000);

    // Unidades en segundos
    const MINUTO = 60;
    const HORA = 3600;
    const DIA = 86400;

    if (Math.abs(diferenciaEnSegundos) < MINUTO) {
      return rtf.format(diferenciaEnSegundos, 'second');
    }
    if (Math.abs(diferenciaEnSegundos) < HORA) {
      return rtf.format(Math.round(diferenciaEnSegundos / MINUTO), 'minute');
    }
    if (Math.abs(diferenciaEnSegundos) < DIA * 2) {
      // Usar horas hasta los 2 días
      return rtf.format(Math.round(diferenciaEnSegundos / HORA), 'hour');
    }
    // Para días, semanas, meses, etc. se puede seguir la misma lógica
    return rtf.format(Math.round(diferenciaEnSegundos / DIA), 'day');
  }

  return (
    <List
      sx={{
        width: '100%',
        maxWidth: 330,
        maxHeight: 500,
        py: 0,
        borderRadius: '10px',
        [theme.breakpoints.down('md')]: {
          maxWidth: 300
        },
        '& .MuiListItemSecondaryAction-root': {
          top: 22
        },
        '& .MuiDivider-root': {
          my: 0
        },
        '& .list-container': {
          pl: 7
        }
      }}
    >
      {notifications.map((notification, index) => {
        return (
          <Grid item xs={12} key={index}>
            <ListItemWrapper>
              <ListItem alignItems="center">
                <ListItemAvatar>
                  <Avatar alt="image" src={require(`../assets/images/${notification.image || 'sos.png'}`)} />
                </ListItemAvatar>
                <ListItemText primary={notification.title || 'No hay título'} />
                <ListItemSecondaryAction>
                  <Grid container justifyContent="flex-end">
                    <Grid item xs={12}>
                      <Typography variant="caption" display="block" gutterBottom sx={{color: theme.palette.primary.light}}>
                        {obtenerTiempoRelativoModerno(notification.time) || ''}
                      </Typography>
                    </Grid>
                  </Grid>
                </ListItemSecondaryAction>
              </ListItem>
              <Grid container direction="column" className="list-container">
                <Grid item xs={12} sx={{ pb: 2 }}>
                  <Typography variant={"caption"}>{notification.description || 'No hay descripción'}</Typography>
                </Grid>
                {notification.unread && (
                  <Grid item xs={12}>
                    <Grid container>
                      <Grid item>
                        <Chip label="No leída" sx={chipErrorSX} />
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </ListItemWrapper>
            <Divider />
          </Grid>
        );
      })}
    </List>
  );
};

export default NotificationList;
