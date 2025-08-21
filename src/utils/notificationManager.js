// src/utils/notificationManager.js
import React, { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase";

/**
 * Solicita permiso para notificaciones y, si se concede, obtiene y muestra el token de FCM en la consola.
 * Muestra alertas para informar al usuario sobre el proceso.
 */
export const requestAndLogToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Permiso de notificación concedido.");

      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_VAPID_KEY,
      });

      console.log("TOKEN DEL DISPOSITIVO:", token);
    } else {
      console.log("Permiso de notificación denegado.");
    }
  } catch (error) {
    console.error("Ocurrió un error al obtener el token:", error);
  }
};

/**
 * Componente sin UI que se encarga de escuchar los mensajes de FCM
 * cuando la aplicación está en primer plano.
 */
export const NotificationListener = () => {
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: "/logo.png",
      };

      new Notification(notificationTitle, notificationOptions);
    });

    // Se desuscribe del listener cuando el componente se desmonta para evitar fugas de memoria.
    return () => unsubscribe();
  }, []);

  return null; // No renderiza ningún elemento en el DOM.
};
