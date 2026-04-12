# Instrucciones de Configuración (Meta for Developers y Firebase)

Para que el chatbot funcione de forma 100% gratuita, necesitas conectar este código con Facebook y WhatsApp. Sigue estos pasos al pie de la letra:

## PASO 1: Subir el código a Firebase
1. Abre tu terminal y asegúrate de tener instalado `firebase-tools` (`npm install -g firebase-tools`).
2. Inicia sesión en Firebase: `firebase login`.
3. Selecciona tu proyecto en el archivo `.firebaserc` (cambia `"tu-proyecto-firebase"` por el ID de tu proyecto en la consola de Firebase).
4. Dentro de la carpeta `functions/`, ejecuta:
   ```bash
   npm run build
   firebase deploy --only functions
   ```
5. Firebase te dará una URL (por ejemplo: `https://us-central1-tu-proyecto.cloudfunctions.net/chatbot`). Guarda esta URL, la necesitaremos luego.

## PASO 2: Crear la App en Meta for Developers
1. Ve a [Meta for Developers](https://developers.facebook.com/) e inicia sesión con tu cuenta de Facebook.
2. Haz clic en "Mis Apps" y luego en "Crear App".
3. Selecciona "Otros" y luego el tipo "Negocios".
4. Ponle un nombre (ej. "Perfumería Bot") y asocia tu cuenta comercial si tienes una.

## PASO 3: Configurar Messenger (Facebook)
1. En el panel de tu App de Meta, busca el producto "Messenger" y haz clic en "Configurar".
2. En la sección "Tokens de acceso", asocia tu Página de Facebook de la perfumería y haz clic en "Generar token". Guarda este **PAGE_ACCESS_TOKEN**.
3. En la sección "Webhooks", haz clic en "Configurar":
   - **URL de devolución de llamada:** Pon la URL de Firebase que obtuviste en el Paso 1 y agrégale `/webhook` al final. (Ej: `https://us-central1-tu-proyecto.cloudfunctions.net/chatbot/webhook`).
   - **Token de verificación:** Escribe `mi_super_token_secreto_123` (o cámbialo en el código de `index.ts` si lo deseas).
4. Haz clic en "Verificar y guardar". (Si el código está corriendo en Firebase, Meta lo aprobará instantáneamente).
5. En la misma sección de Webhooks, haz clic en "Administrar" y suscríbete a los eventos: `messages` y `feed`.

## PASO 4: Configurar WhatsApp Business API
1. En el panel de tu App de Meta, busca el producto "WhatsApp" y haz clic en "Configurar".
2. Ve a "Configuración de la API" (API Setup).
3. Meta te dará un número de prueba temporal. Para producción, añade tu propio número real en la sección de administración de números.
4. Obtén el **ID del número de teléfono** (`WA_PHONE_NUMBER_ID`) y el **Token de acceso temporal** (`WA_ACCESS_TOKEN`). *(Nota: Para que el token no expire cada 24h, debes crear un usuario del sistema en tu Business Manager y generar un token permanente).*

## PASO 5: Actualizar el código con tus Credenciales
1. Vuelve al archivo `functions/src/index.ts`.
2. En las primeras líneas, verás unas variables. Reemplázalas con los valores que obtuviste de Meta:
   ```typescript
   const PAGE_ACCESS_TOKEN = "TU_TOKEN_DE_MESSENGER_AQUI";
   const WA_PHONE_NUMBER_ID = "TU_ID_DE_TELEFONO_WHATSAPP_AQUI";
   const WA_ACCESS_TOKEN = "TU_TOKEN_DE_WHATSAPP_AQUI";
   const OWNER_WHATSAPP_NUMBER = "59160000000"; // Tu número de WhatsApp real donde llegarán los pedidos (con código de país, ej. 591 para Bolivia, sin el símbolo +)
   ```
3. Vuelve a ejecutar `npm run build` y luego `firebase deploy --only functions` para actualizar el bot con tus credenciales.

¡Listo! Ya puedes ir a tu Página de Facebook desde otro usuario y enviar un mensaje para probar el chatbot.

## (Opcional) Problema del Marketplace
Recuerda que si publicas en Marketplace desde tu usuario personal, debes usar una "Respuesta rápida" en tu teclado cuando alguien te pregunte en tu Messenger personal:
*"¡Hola! Para ver disponibilidad, catálogo y agendar entregas al instante, haz clic aquí para hablar con nuestra tienda: https://m.me/NombreDeTuPagina"*
