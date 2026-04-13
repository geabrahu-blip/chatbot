# Instrucciones para la Configuración del Chatbot en Meta y Firebase

Este documento describe cómo se configuró el chatbot de forma 100% gratuita usando Firebase y la API oficial de Meta.

## 1. Configuración de Firebase
El proyecto está construido usando Firebase Cloud Functions (Node.js/TypeScript).

1. El código fuente está en la carpeta `functions/src/index.ts`.
2. Las credenciales y tokens **no deben guardarse en el código**. Se han movido a un archivo llamado `.env` dentro de la carpeta `functions/`.
3. El archivo `functions/.env` debe contener lo siguiente (con tus datos reales):
   ```
   PAGE_ACCESS_TOKEN=tu_token_de_pagina
   WA_PHONE_NUMBER_ID=tu_identificador_de_whatsapp
   WA_ACCESS_TOKEN=tu_token_de_whatsapp
   OWNER_WHATSAPP_NUMBER=tu_numero_de_whatsapp
   VERIFY_TOKEN=mi_super_token_secreto_123
   ```
4. Para subir cambios al servidor, ejecuta en la terminal dentro de la carpeta `functions`:
   ```bash
   npm run build
   npx firebase-tools deploy --only functions --project chatbot-6eca5
   ```

## 2. Notas Importantes sobre WhatsApp
Para que el chatbot pueda enviarte las notificaciones de nuevos pedidos a tu WhatsApp personal de forma gratuita, debes tener en cuenta una regla importante de Meta:

* **La ventana de 24 horas:** El número de prueba de WhatsApp de Meta solo puede enviar mensajes de texto libre (como los resúmenes de pedidos) a tu número personal **si tú le has enviado un mensaje primero en las últimas 24 horas**.
* Por lo tanto, si en algún momento dejas de recibir los pedidos en tu WhatsApp, simplemente envíale cualquier mensaje (ej. "Hola") desde tu WhatsApp personal al número de prueba de Meta. Esto abrirá la ventana de 24 horas nuevamente.

## 3. Configuración de Webhooks en Meta
* **URL de devolución de llamada (Callback URL):** `https://us-central1-chatbot-6eca5.cloudfunctions.net/chatbot/webhook`
* **Token de verificación (Verify Token):** `mi_super_token_secreto_123`
* Asegúrate de suscribirte a los eventos `messages` para que el bot reciba los mensajes de texto.
