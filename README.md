# Chatbot para Perfumería (Messenger y WhatsApp)

Este repositorio contiene el código fuente para un Chatbot 100% gratuito diseñado para una perfumería. Está construido con Node.js y se aloja en Firebase Functions usando la capa gratuita (Plan Blaze requerido por políticas de Google, pero sin costo si no superas el límite gratuito).

## Características principales:
1. **Respuesta Automática a Mensajes de Messenger:**
   - Detecta palabras clave ("original", "catálogo", "precio", "ubicación").
   - Ofrece un menú interactivo basado en números o palabras.
2. **Flujos de Venta:**
   - **Local:** Solicita producto, día y hora, indicando que el pago es contra entrega.
   - **Envíos Nacionales:** Solicita datos completos (CI, Nombre, Teléfono, Transportadora, Ciudad) e indica que el pago es por adelantado.
3. **Respuesta Automática a Comentarios:**
   - Cuando un cliente comenta en tus publicaciones (ej. "precio", "info"), el bot le envía un mensaje privado automáticamente para iniciar el proceso de compra.
4. **Notificaciones de Pedidos por WhatsApp:**
   - Una vez que un cliente completa los pasos del pedido en Messenger, el bot te envía un mensaje automático a tu propio número de WhatsApp Business con el resumen del pedido para que lo despaches.

## Requisitos previos:
- Una cuenta en **Firebase** con el plan Blaze activo (por el uso de Node.js).
- Una **Página de Facebook** de tu perfumería.
- Un número de teléfono registrado en **WhatsApp Business**.
- Una cuenta en **Meta for Developers**.

## Instrucciones de Instalación
Sigue las instrucciones detalladas paso a paso en el archivo `INSTRUCCIONES_META.md`.
