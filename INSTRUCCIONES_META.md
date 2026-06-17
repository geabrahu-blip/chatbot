# Instrucciones para la Configuración del Chatbot (IA + WhatsApp Oficial)

Este documento describe cómo configurar el chatbot utilizando Firebase, Google Gemini AI y la API oficial de WhatsApp Cloud.

## 1. Configuración de Catálogo
1. Ve a la carpeta `functions/src/`.
2. Verás un archivo llamado `catalogo.json`.
3. Exporta la lista de perfumes desde tu página web en este mismo formato JSON y reemplaza el contenido. **Cada vez que cambies el catálogo, debes volver a desplegar el código en Firebase.**

## 2. Configuración de Variables de Entorno (Archivo .env)
El archivo `functions/.env` debe contener lo siguiente (con tus datos reales):

```
# Para Facebook Messenger / Instagram
PAGE_ACCESS_TOKEN=tu_token_de_pagina

# Para WhatsApp Cloud API
WA_PHONE_NUMBER_ID=tu_identificador_de_numero_de_whatsapp
WA_ACCESS_TOKEN=tu_token_de_acceso_permanente_whatsapp

# Para el Webhook (Cualquier contraseña inventada por ti)
VERIFY_TOKEN=mi_super_token_secreto_123

# Para Inteligencia Artificial
GEMINI_API_KEY=tu_clave_api_de_google_gemini
```

### ¿Cómo obtener la GEMINI_API_KEY?
1. Ve a [Google AI Studio](https://aistudio.google.com/).
2. Inicia sesión con tu cuenta de Google.
3. Haz clic en **"Get API Key"** y luego en **"Create API Key"**. Copia ese código en tu `.env`.

### ¿Cómo obtener los datos de WhatsApp API?
1. Ve a [Meta for Developers](https://developers.facebook.com/).
2. Crea o selecciona tu aplicación.
3. En el menú lateral, busca **"WhatsApp"** -> **"Configuración de la API"**.
4. Ahí verás el **Identificador del número de teléfono** (`WA_PHONE_NUMBER_ID`).
5. Para el `WA_ACCESS_TOKEN`, necesitas crear un usuario del sistema en tu Meta Business Manager y generarle un token de acceso permanente con permisos de `whatsapp_business_messaging` y `whatsapp_business_management`.

## 3. Despliegue en Firebase
Para subir los cambios al servidor, ejecuta en la terminal, dentro de la carpeta `functions`:
```bash
npm run build
npx firebase-tools deploy --only functions --project chatbot-6eca5
```

*(Recuerda que debes hacer esto localmente o desde un entorno donde tengas permisos de Firebase, ya que en el entorno de IA no hay acceso a las credenciales).*

## 4. Configuración de Webhooks en Meta
Una vez desplegado el código, copia la URL que te da Firebase (algo como `https://us-central1-chatbot-6eca5.cloudfunctions.net/chatbot/webhook`).

1. En Meta for Developers, ve a **WhatsApp -> Configuración**.
2. Haz clic en **Editar** en la sección de Webhooks.
3. **URL de devolución de llamada:** (La URL de tu función en Firebase terminada en `/webhook`).
4. **Token de verificación:** El mismo que pusiste en `VERIFY_TOKEN` en tu `.env` (ej: `mi_super_token_secreto_123`).
5. Haz clic en Verificar y Guardar.
6. **MUY IMPORTANTE:** Haz clic en "Administrar" al lado de Campos del Webhook y suscríbete al evento `messages`.
