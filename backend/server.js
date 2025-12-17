import dotenv from 'dotenv';
dotenv.config();

// 1. IMPORTACIONES MODERNAS (ES MODULES)
import express from 'express';
import cors from 'cors';
import multer from 'multer'; // Para recibir imágenes si lo necesitas luego
import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import pino from 'pino';

// 2. CONFIGURACIÓN
const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Multer (Igual que en tu ejemplo)
const upload = multer({ storage: multer.memoryStorage() });

// Supabase y OpenRouter
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY });

let sock;

// 3. CONEXIÓN A WHATSAPP (MÉTODO CÓDIGO DE VINCULACIÓN)
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    console.log("🔵 Iniciando conexión con WhatsApp...");

    // @ts-ignore
    const socketFn = makeWASocket.default || makeWASocket; 

    sock = socketFn({
        version,
        logger: pino({ level: 'silent' }), // Silencioso para ver bien el código
        auth: state,
        printQRInTerminal: false, // APAGAMOS EL QR PARA EVITAR EL ERROR 405
        browser: ["Ubuntu", "Chrome", "20.0.04"], // Navegador estable
        markOnlineOnConnect: true
    });

    // --- LÓGICA DE VINCULACIÓN (SIN CÁMARA) ---
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            // 👇👇👇 ¡PON AQUÍ TU NÚMERO! (Solo números, sin +) 👇👇👇
            const numeroBot = "584129351790"; 
            
            try {
                const code = await sock.requestPairingCode(numeroBot);
                console.log("\n==================================================");
                console.log("🤖 TU CÓDIGO DE VINCULACIÓN ES:");
                console.log(`\x1b[32m${code}\x1b[0m`); // Código en Verde
                console.log("==================================================");
                console.log("👉 Ve a WhatsApp en tu cel -> Dispositivos Vinculados -> Vincular -> Vincular con número de teléfono");
            } catch (e) {
                console.log("Error pidiendo código:", e);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("🔄 Reconectando...");
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('\n✅ ¡CONEXIÓN EXITOSA! EL BOT ESTÁ ONLINE.\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();

// 4. LÓGICA IA (OpenRouter)
async function generarMensaje(nombre) {
    try {
        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: [{
                role: "system",
                content: `
    ACTÚA COMO: Promotor de "Flow La Guaira".
    OBJETIVO: Vender rifa de Moto SBR 2025.

    INSTRUCCIONES DE FORMATO (ESTRICTO):
    1. NEGRITAS: Usa asteriscos (*) en: *JEEIPH*, *Moto SBR 0km 2025*, *Flow La Guaira*.
    2. EMOJIS: ¡SON OBLIGATORIOS! Usa MÍNIMO 4 emojis del siguiente set: 🔥 🏍️ 👹 💸 🎫 📍 🚀.
       - Colócalos al final de las frases clave.
    3. ESPACIADO: ¡OJO AQUÍ! Debes separar las ideas con una línea vacía. 
       - Saludo (espacio) Cuerpo (espacio) Cierre.
    4. MÁXIMO 3 PÁRRAFOS: No más de 3 párrafos por mensaje.

    REGLAS DE TONO:
    - Saludo: "Epa ${nombre}!" o "Feliz dia ${nombre}!".
    - Estilo: Callejero pero entendible. Tuteo (nada de "usted").
    - Cierre: Llamado a la acción directo.

    EJEMPLO DE SALIDA PERFECTA (Fíjate en los espacios):
    "Epa *${nombre}*! 👹 ¿Todo bien?

    Recuerda que somos la gente que montó el evento de *JEEIPH* 🔥. Mano, no te quedes pegado y compra tu ticket para la *Moto SBR 0km 2025* 🏍️.

    ¡Gánatela antes de que se acaben los números! 🎫💸 
    ¿Te mando el link para que compres tu numero ganador? 🚀"

    ⚠️ IMPORTANTE: ¡NO OLVIDES LOS EMOJIS NI LOS ESPACIOS ENTRE PÁRRAFOS! SON VITALES.
    `
            }],
            temperature: 0.6,
        });
        return completion.choices[0].message.content.replace(/^"|"$/g, '');
    } catch (e) {
        return `Epa ${nombre}, activo con Flow La Guaira? Estamos rifando una Moto 0km!`;
    }
}

// 5. ENDPOINT INICIAR CAMPAÑA
app.post('/iniciar-campana', async (req, res) => {
    res.json({ message: "Iniciando envío..." });

    const { data: contactos } = await supabase
        .from('contactos')
        .select('*')
        .eq('status', 'pendiente')
        .limit(5);

    if (!contactos?.length) return console.log("⚠️ No hay pendientes.");

    console.log(`🚀 Procesando ${contactos.length} contactos...`);

    for (const contacto of contactos) {
        try {
            // 1. LIMPIEZA DE NÚMERO
            let numero = contacto.telefono.replace(/\D/g, ''); 
            if(numero.startsWith('0')) numero = '58' + numero.slice(1);
            
            const jid = `${numero}@s.whatsapp.net`;

            // 2. LIMPIEZA DE NOMBRE (Para que diga "Epa Jose" y no "Epa Jose Javier...")
            let primerNombre = contacto.nombre.split(' ')[0];
            // Lo ponemos bonito (Primera mayúscula, resto minúscula)
            primerNombre = primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase();
            
            // 3. GENERAR MENSAJE (Usando solo el primer nombre)
            // ⚠️ AQUÍ ESTABA EL ERROR: Solo declaramos 'mensaje' una vez
            const mensaje = await generarMensaje(primerNombre);
            
            // 4. SIMULAR ESCRITURA HUMANA
            await sock.sendPresenceUpdate('composing', jid);
            await delay(mensaje.length * 50); // Escribe más rápido o lento según el largo
            await sock.sendPresenceUpdate('paused', jid);

            // 5. ENVIAR
            await sock.sendMessage(jid, { text: mensaje });

            // 6. ACTUALIZAR BASE DE DATOS
            await supabase.from('contactos')
                .update({ status: 'enviado', mensaje_enviado: mensaje })
                .eq('id', contacto.id);
                
            console.log(`✅ Enviado a: ${primerNombre} (${numero})`);

            // 7. PAUSA ANTI-BAN (Entre 5 y 15 segundos)
            const tiempo = Math.floor(Math.random() * 10000) + 5000;
            await delay(tiempo);

        } catch (error) {
            console.error(`❌ Error con ${contacto.nombre}:`, error);
            await supabase.from('contactos').update({ status: 'error' }).eq('id', contacto.id);
        }
    }
});

const port = 3001;

// --- PEGAR ESTO ANTES DE app.listen ---

// 1. Ruta para probar Supabase
app.get('/api/supabase-test', async (req, res) => {
    try {
        const { count, error } = await supabase.from('contactos').select('*', { count: 'exact', head: true });
        if (error) throw error;
        res.json({ message: "✅ Conexión con Supabase exitosa!", total_contactos: count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Ruta para probar la IA (Generar)
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body; 
    try {
        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: [{ role: "user", content: prompt || "Di hola" }],
        });
        const respuesta = completion.choices[0].message.content;
        res.json({ result: respuesta });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error generando texto" });
    }
});

app.listen(port, () => console.log(`Servidor listo en puerto ${port}`));