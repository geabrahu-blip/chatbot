import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as express from "express";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import * as catalogo from "./catalogo.json";

admin.initializeApp();

const app = express();
app.use(express.json());

// Variables de entorno de Firebase o configurables manualmente
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mi_super_token_secreto_123";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || "TU_PAGE_ACCESS_TOKEN";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "TU_WA_PHONE_NUMBER_ID";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "TU_WA_ACCESS_TOKEN";

// Inicializar Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

// Generar respuesta con Gemini
async function generateGeminiResponse(userMessage: string): Promise<string> {
  const systemInstruction = `Eres un asistente virtual muy formal, paciente y amable para una perfumería exclusiva.
Tu objetivo principal es ayudar a los clientes a encontrar la fragancia ideal, responder a sus dudas y guiarlos hacia una compra.
Siempre debes expresarte con mucho respeto y elegancia.
Al final de cada uno de tus mensajes, debes incluir una pregunta orientada a cerrar la venta o a conocer mejor los gustos del cliente (por ejemplo: "¿Qué tipo de fragancia busca el día de hoy?", "¿Le gustaría ver detalles de algún otro perfume?", "¿Desea que le registre su pedido?").

Aquí tienes el catálogo de perfumes disponibles en formato JSON:
${JSON.stringify((catalogo as any).default || catalogo)}

Si el cliente pregunta por el precio, detalles o imágenes de un perfume, busca en el catálogo y proporciona la información exacta, incluyendo la URL de la imagen del producto (imagen_url).

Información importante:
- Ubicación: Cochabamba, Bolivia (https://maps.app.goo.gl/ps4MgLXPyny8hUBH9).
- Horario de atención: Martes a domingo de 10:00 AM a 19:30 PM.
- Entregas:
  * Opción A: Católica (Lunes a Viernes 14:15 PM)
  * Opción B: Correo (Sábados 18:00 a 19:30 PM)
  * Opción C: Recoger en sucursal.
- Para confirmar un pedido, indícale al cliente que nos envíe un mensaje diciendo "Confirmar pedido" junto con los detalles de entrega y su número.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: {
        systemInstruction,
      }
    });

    return response.text || "Lo siento, ha ocurrido un error al procesar su solicitud. ¿En qué más puedo ayudarle?";
  } catch (error) {
    console.error("Error con Gemini:", error);
    return "Disculpe, en este momento no puedo procesar su solicitud. Por favor, intente nuevamente más tarde. ¿Hay algo más en lo que le pueda asistir?";
  }
}

// Manejar los mensajes entrantes de Messenger/Instagram
async function handleMessage(senderPsid: string, receivedMessage: any) {
  let responseText = "";

  if (receivedMessage.text) {
    responseText = await generateGeminiResponse(receivedMessage.text);
  }

  // Enviar el mensaje
  if (responseText) {
    await sendMessengerText(senderPsid, responseText);
  }
}

// Enviar un mensaje de texto por WhatsApp Oficial
async function sendWhatsAppMessage(recipientPhone: string, text: string) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${WA_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error enviando mensaje por WhatsApp Oficial:", error?.response?.data || error);
  }
}

// Manejar los mensajes entrantes de WhatsApp Oficial
async function handleWhatsAppMessage(senderPhone: string, messageBody: string) {
  const responseText = await generateGeminiResponse(messageBody);
  if (responseText) {
    await sendWhatsAppMessage(senderPhone, responseText);
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

// Endpoint POST para recibir mensajes de Facebook, Instagram y WhatsApp
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
                    const privateMsg = await generateGeminiResponse("Hola, me interesa saber más sobre sus productos. Respondí a un comentario.");
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
      console.error("Error procesando webhook (Page/IG):", error);
      res.status(500).send("INTERNAL_SERVER_ERROR");
    }
  } else if (body.object === "whatsapp_business_account") {
    try {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            for (const msg of change.value.messages) {
              if (msg.type === "text") {
                const senderPhone = msg.from;
                const messageBody = msg.text.body;
                await handleWhatsAppMessage(senderPhone, messageBody);
              }
            }
          }
        }
      }
      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("Error procesando webhook (WhatsApp):", error);
      res.status(500).send("INTERNAL_SERVER_ERROR");
    }
  } else {
    res.sendStatus(404);
  }
});

// Exportar la app Express como Firebase Function
export const chatbot = functions.https.onRequest(app);
