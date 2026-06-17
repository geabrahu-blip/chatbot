# Chatbot Inteligente para Perfumería (Messenger, Instagram y WhatsApp)

Este repositorio contiene el código fuente para un Chatbot inteligente y gratuito diseñado para una perfumería. Está construido con Node.js, utiliza **Google Gemini AI** para tener conversaciones naturales, y se aloja en Firebase Functions usando la capa gratuita (Plan Blaze requerido, pero sin costo si no superas el límite gratuito).

## Características principales:
1. **Inteligencia Artificial con Google Gemini:**
   - Ya no depende de menús robóticos ni palabras clave. El bot conversa de forma natural, es paciente, muy formal y busca siempre cerrar ventas o entender las necesidades del cliente.
2. **Catálogo Integrado:**
   - Lee los productos directamente desde un archivo `catalogo.json`. Si un cliente pide un perfume, el bot le dice el precio y le manda el enlace a la imagen del perfume automáticamente.
3. **Respuesta Automática en Facebook, Instagram y WhatsApp Oficial:**
   - El bot funciona tanto en la bandeja de entrada de tu página de Facebook / Instagram, como directamente dentro de la **API Oficial de WhatsApp Cloud** de Meta (hasta 1,000 conversaciones gratis al mes).
4. **Respuesta Automática a Comentarios:**
   - Cuando un cliente comenta en tus publicaciones (ej. "precio", "info"), el bot genera una respuesta amable con IA y le envía un mensaje privado automáticamente.

## Requisitos previos:
- Una cuenta en **Firebase** con el plan Blaze activo.
- Una cuenta en **Meta for Developers** (para Messenger, Instagram y WhatsApp Cloud API).
- Un número de teléfono para registrar en **WhatsApp Business API** (Atención: una vez registrado en la API oficial, este número no podrá usarse en la aplicación normal de WhatsApp en el celular).
- Una **Página de Facebook** de tu perfumería.
- Una **API Key de Google Gemini** (Gratuita en Google AI Studio).

## Instrucciones de Instalación
Sigue las instrucciones detalladas paso a paso en el archivo `INSTRUCCIONES_META.md`.
