import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import axios from "axios";

admin.initializeApp();

const app = express();
app.use(express.json());

// Variables de entorno de Firebase o configurables manualmente
const VERIFY_TOKEN = "mi_super_token_secreto_123";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || "TU_PAGE_ACCESS_TOKEN";
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "TU_WA_PHONE_NUMBER_ID";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "TU_WA_ACCESS_TOKEN";
const OWNER_WHATSAPP_NUMBER = process.env.OWNER_WHATSAPP_NUMBER || "TU_NUMERO_WHATSAPP_CON_CODIGO_PAIS";

// Endpoint de verificación (necesario para que Meta valide el Webhook)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Enviar un mensaje de texto por Messenger
async function sendMessengerText(senderPsid: string, text: string) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: senderPsid },
        message: { text },
      }
    );
  } catch (error) {
    console.error("Error enviando mensaje Messenger:", error);
  }
}

// Manejar los mensajes entrantes
async function handleMessage(senderPsid: string, receivedMessage: any) {
  let responseText = "";

  if (receivedMessage.text) {
    const msg = receivedMessage.text.toLowerCase();

    // Palabras clave principales
    if (msg.includes("original") || msg.includes("originales")) {
      responseText = "¡Hola! Sí, todos nuestros perfumes son 100% originales garantizados.";
    }
    else if (msg.includes("ubicacion") || msg.includes("ubicación") || msg.includes("donde")) {
      responseText = "Somos una tienda virtual. Hacemos entregas personales y envíos a todo el país. ¿Te gustaría ver nuestro catálogo o realizar un pedido?";
    }
    else if (msg.includes("catalogo") || msg.includes("catálogo") || msg.includes("precio")) {
      responseText = "Puedes ver nuestro catálogo completo con todos los perfumes disponibles y precios actualizados en nuestra página web: [INSERTE AQUÍ SU ENLACE WEB]";
    }

    // Menú principal y opciones numéricas
    else if (msg === "1" || msg.includes("comprar") || msg.includes("pedido")) {
      responseText = "¡Excelente! ¿Tu pedido es para entrega local o envío a otra ciudad?\n\nResponde 'LOCAL' para entrega aquí.\nResponde 'ENVIO' para mandar a otra ciudad.";
    }

    // Flujo Venta Local
    else if (msg === "local") {
      responseText = "Perfecto. Por favor, indícame qué perfume deseas, el día y la hora que prefieres para la entrega.\n\n(Nota: El pago es a contra entrega).";
    }
    else if (msg.includes("entrega") && msg.includes("hora") && !msg.includes("local")) {
      responseText = "¡Pedido recibido! Tu solicitud de entrega local ha sido agendada. Nos pondremos en contacto contigo pronto para confirmar. ¡Gracias!";
      await sendWhatsAppNotification(`📦 NUEVO PEDIDO LOCAL 📦\n\nMensaje del cliente:\n"${receivedMessage.text}"\n\nPor favor contáctalo por Messenger (PSID: ${senderPsid}) para confirmar.`);
    }

    // Flujo Venta por Envío
    else if (msg === "envio" || msg === "envío") {
      responseText = "Para envíos a otra ciudad, el pago es por adelantado. Una vez verifiquemos el pago, realizamos el envío.\n\nPor favor, envíame en un solo mensaje los siguientes datos:\n- Carnet de Identidad\n- Nombre completo\n- Teléfono\n- Transportadora de preferencia\n- Ciudad a enviar";
    }
    else if (msg.includes("ci") || msg.includes("carnet") || (msg.includes("nombre") && msg.includes("ciudad"))) {
      responseText = "¡Datos recibidos perfectamente! Por favor, envíanos el comprobante de pago por este medio. Una vez confirmado, te enviaremos la foto del comprobante de la transportadora a tu WhatsApp.";
      await sendWhatsAppNotification(`🚚 NUEVO PEDIDO PARA ENVÍO 🚚\n\nDatos del cliente:\n"${receivedMessage.text}"\n\nPor favor revisa el comprobante de pago en Messenger (PSID: ${senderPsid}) y realiza el envío.`);
    }

    // Saludo inicial genérico
    else {
      responseText = `¡Hola! Bienvenido a nuestra perfumería.\n¿En qué te podemos ayudar?\n\nResponde con el número de la opción:\n1. Hacer un pedido\n2. Ver catálogo y precios\n3. Información sobre originalidad y ubicación`;
    }
  }

  // Enviar el mensaje
  if (responseText) {
    await sendMessengerText(senderPsid, responseText);
  }
}

// Enviar notificación al WhatsApp del dueño usando la Cloud API de WhatsApp
async function sendWhatsAppNotification(messageText: string) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${WA_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: OWNER_WHATSAPP_NUMBER,
        type: "text",
        text: { body: messageText },
      },
      {
        headers: {
          "Authorization": `Bearer ${WA_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Notificación enviada a WhatsApp.");
  } catch (error) {
    console.error("Error enviando notificación a WhatsApp:", error);
  }
}

// Enviar un mensaje de respuesta privada a un comentario (Private Replies API)
async function sendPrivateReply(commentId: string, text: string) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${commentId}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`,
      { message: text }
    );
  } catch (error) {
    console.error("Error enviando respuesta privada a comentario:", error);
  }
}

// Endpoint POST para recibir mensajes de Facebook
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    try {
      for (const entry of body.entry) {
        // 1. Manejo de mensajes de Messenger (Inbox)
        if (entry.messaging) {
          for (const webhookEvent of entry.messaging) {
            const senderPsid = webhookEvent.sender.id;

            if (webhookEvent.message && !webhookEvent.message.is_echo) {
               await handleMessage(senderPsid, webhookEvent.message);
            }
          }
        }

        // 2. Manejo de comentarios en la página (Feed)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "feed" && change.value.item === "comment" && change.value.verb === "add") {
              const commentId = change.value.comment_id;
              const messageText = change.value.message.toLowerCase();
              const fromId = change.value.from.id; // ID del usuario que comentó
              const pageId = entry.id; // ID de tu página

              // Evitar que el bot se responda a sí mismo
              if (fromId !== pageId) {
                if (messageText.includes("precio") || messageText.includes("info") || messageText.includes("disponible") || messageText.includes("catalogo")) {
                  const privateMsg = "¡Hola! Gracias por comentar. Para ver el catálogo completo, disponibilidad y hacer un pedido, por favor responde a este mensaje o escribe un número:\n1. Hacer pedido\n2. Ver catálogo";
                  await sendPrivateReply(commentId, privateMsg);
                }
              }
            }
          }
        }
      }

      // Enviar 200 OK SOLO AL FINAL, después de procesar todas las promesas asíncronas
      // De lo contrario, Firebase Function cerrará el proceso antes de que se envíen los mensajes
      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("Error procesando webhook:", error);
      res.status(500).send("INTERNAL_SERVER_ERROR");
    }
  } else {
    res.sendStatus(404);
  }
});

// Exportar la app Express como Firebase Function
export const chatbot = functions.https.onRequest(app);
