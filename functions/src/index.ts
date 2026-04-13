import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as express from "express";
import axios from "axios";

admin.initializeApp();

const app = express();
app.use(express.json());

// Variables de entorno de Firebase o configurables manualmente
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mi_super_token_secreto_123";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || "TU_PAGE_ACCESS_TOKEN";
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

    // Opción 2: Catálogo
    if (msg === "2" || msg.includes("catalogo") || msg.includes("catálogo") || msg.includes("precio")) {
      responseText = "¡Claro que sí! Puedes ver nuestro catálogo completo con todos los perfumes disponibles y precios actualizados en nuestra página web aquí:\n👉 https://inventario-perfumes.web.app/catalogo";
    }
    // Opción 3: Ubicación y Horarios
    else if (msg === "3" || msg.includes("ubicacion") || msg.includes("ubicación") || msg.includes("donde")) {
      responseText = "Puedes encontrarnos en la siguiente ubicación:\n📍 https://maps.app.goo.gl/ps4MgLXPyny8hUBH9, Cochabamba, Bolivia.\n\nNuestro horario de atención es solo de martes a domingo de 10:00 AM a 19:30 PM. ¡Te esperamos!";
    }
    // Opción 1: Hacer un pedido
    else if (msg === "1" || msg.includes("comprar") || msg.includes("pedido")) {
      responseText = "¡Excelente! Para registrar tu pedido, envíame en un solo mensaje la palabra *Confirmar* seguida del perfume que deseas y la opción de entrega de tu preferencia:\n\n🔹 *Opción A:* Entregas en la Católica (Lunes a Viernes a las 14:15 PM).\n🔹 *Opción B:* Entregas en el Correo (Solo Sábados de 18:00 a 19:30 PM).\n🔹 *Opción C:* Recoger en sucursal.\n\nEjemplo: Confirmar: Perfume Bleu de Chanel, Opción C y mi número es 77712345.";
    }
    // Flujo Venta / Confirmar pedido - CON LINK DE WHATSAPP DIRECTO
    else if (msg.includes("confirmar")) {
      const encodedMessage = encodeURIComponent(`Hola, vengo de la página de Facebook. Este es mi pedido:\n\n${receivedMessage.text}`);
      const whatsappLink = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodedMessage}`;

      responseText = `¡Casi listo! Tu pedido está pre-registrado. Para finalizar y coordinar la entrega, por favor haz clic en este enlace para enviarnos tu confirmación directo a nuestro WhatsApp:\n\n👉 ${whatsappLink}\n\n¡Gracias por tu preferencia!`;
    }
    // Saludo inicial genérico
    else {
      responseText = `¡Hola! Bienvenido a nuestra perfumería.\n¿En qué te podemos ayudar hoy?\n\nPor favor responde con el número de la opción que buscas:\n1. Hacer un pedido\n2. Ver catálogo y precios\n3. Ubicación y Horarios`;
    }
  }

  // Enviar el mensaje
  if (responseText) {
    await sendMessengerText(senderPsid, responseText);
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

// Endpoint POST para recibir mensajes de Facebook e Instagram
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page" || body.object === "instagram") {
    try {
      for (const entry of body.entry) {
        // 1. Manejo de mensajes de Messenger (Inbox) e Instagram
        if (entry.messaging) {
          for (const webhookEvent of entry.messaging) {
            const senderId = webhookEvent.sender.id;

            if (webhookEvent.message && !webhookEvent.message.is_echo) {
               await handleMessage(senderId, webhookEvent.message);
            }
          }
        }

        // 2. Manejo de comentarios en la página (Feed)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "feed" && change.value.item === "comment" && change.value.verb === "add") {
              const commentId = change.value.comment_id;
              const rawMessage = change.value.message;

              if (rawMessage) {
                const messageText = rawMessage.toLowerCase();
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
      }

      // Enviar 200 OK SOLO AL FINAL, después de procesar todas las promesas asíncronas
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
