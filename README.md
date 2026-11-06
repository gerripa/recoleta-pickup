<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>README</strong></p>
<p><strong>Recoleta PickUp</strong></p>
<p>Retiro en el local con beneficios, integrado en la compra</p>
<p>Grupo 8 · IA Aplicada a Negocios · ITBA · TP3</p></td>
</tr>
</tbody>
</table>

|                | **DATOS DEL PROYECTO**                                                                                                             |
|----------------|------------------------------------------------------------------------------------------------------------------------------------|
| **Empresa**    | Recoleta al Fallo, suplementos deportivos (Tiendanube, WhatsApp e Instagram).                                                      |
| **Estado**     | Prototipo navegable. Precios, pedidos, clientes y mails son ficticios; no hay conexión real con Tiendanube, WhatsApp ni Instagram. |
| **Equipo**     | Grupo 8: Guadalupe Erripa, Sofía Rodrigo, Julieta Silberman y Magdalena Ropolo                                                     |
| **Demo**       | claude.ai/artifact/KgFtijeodEnEea5YcjMJwN                                                                                          |
| **Documentos** | docs/PRD.md (requerimientos) · docs/TASKS.md (tareas ODD)                                                                          |

**Qué es**

Recoleta PickUp hace que **retirar en el local le convenga al cliente y
le ordene el día al negocio**. El cliente elige el retiro dentro de la
compra, antes de pagar: pone su email y ve la dirección, el horario del
local y el beneficio que le toca. No elige turno: pasa cuando quiere
dentro del horario. No usa otra app: todo lo demás le llega por mail.

**Funcionalidades**

<table>
<colgroup>
<col style="width: 49%" />
<col style="width: 1%" />
<col style="width: 49%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>PARA EL CLIENTE</strong></p>
<p><strong>✓</strong> Elegir retiro y poner su email antes de pagar</p>
<p><strong>✓</strong> Ver dirección, horario y plazo para retirar</p>
<p><strong>✓</strong> Ver sus beneficios y el total con descuento</p>
<p><strong>✓</strong> Recibir código, aviso de "listo" y
recordatorio</p>
<p><strong>✓</strong> Sumar retiros a su tarjeta de 5</p></td>
<td></td>
<td><p><strong>PARA EL ADMINISTRADOR</strong></p>
<p><strong>✓</strong> Qué preparar y cuánta gente va a pasar</p>
<p><strong>✓</strong> Pedidos de los 3 canales anotados en un panel</p>
<p><strong>✓</strong> Estados, pagos y entrega con código</p>
<p><strong>✓</strong> Pedidos manuales con enlace de reserva</p>
<p><strong>✓</strong> Reglas de beneficios y datos del local</p>
<p><strong>✓</strong> Métricas de impacto y mails enviados</p></td>
</tr>
</tbody>
</table>

**Estado actual**

<table>
<colgroup>
<col style="width: 49%" />
<col style="width: 1%" />
<col style="width: 49%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>YA FUNCIONA</strong></p>
<p><strong>✓</strong> Compra simulada con retiro y beneficios</p>
<p><strong>✓</strong> Enlace para pedidos de WhatsApp e Instagram</p>
<p><strong>✓</strong> Panel completo del administrador</p>
<p><strong>✓</strong> Vista previa de los mails</p></td>
<td></td>
<td><p><strong>FALTA</strong></p>
<p><strong>○</strong> Base de datos real en Supabase y login</p>
<p><strong>○</strong> Validaciones en el servidor</p>
<p><strong>○</strong> Envío real de mails</p>
<p><strong>○</strong> Integración con el checkout de Tiendanube</p>
<p><strong>○</strong> Prueba piloto y medición</p></td>
</tr>
</tbody>
</table>

**Tecnologías**

| **PARTE**             | **QUÉ USAMOS**                                                                   |
|-----------------------|----------------------------------------------------------------------------------|
| **Interfaz**          | React 18 + TypeScript, con Tailwind CSS e íconos lucide-react                    |
| **Compilación**       | Vite                                                                             |
| **Datos (prototipo)** | Almacenamiento del navegador (localStorage), con datos ficticios                 |
| **Datos (versión 1)** | Supabase: PostgreSQL, Auth y RLS                                                 |
| **Desarrollo con IA** | Bolt.new (prototipo), GitHub, VS Code y Claude Code con gentle-ai (ODD y Engram) |

**Cómo ejecutarlo**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p># Requiere Node.js. Instalar y abrir en http://localhost:5173</p>
<p>npm install</p>
<p>npm run dev</p>
<p># Versión en un solo archivo HTML para compartir</p>
<p>SINGLEFILE=1 npx vite build --outDir dist-single</p></td>
</tr>
</tbody>
</table>

**Estructura del proyecto**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>src/store.tsx datos, local, beneficios y mails</p>
<p>src/pages/ pantallas del cliente</p>
<p>src/admin/ panel del administrador</p>
<p>src/components/ local, beneficios y vista de mail</p>
<p>docs/ PRD.md y TASKS.md</p></td>
</tr>
</tbody>
</table>

**Cómo probar la demo**

**1** En el inicio: "Probar una compra" → "Simular nueva compra".

**2** Tocar "Clienta frecuente" y elegir "Retiro en el local": aparecen
la dirección, el horario y el 20 % off antes de pagar.

**3** Pagar (simulado): se ve el código de retiro y el mail de
confirmación.

**4** En el panel → Resumen: marcar un pedido como listo. En Pedidos:
entregarlo con su código.

**5** Revisar Beneficios y Mails automáticos. Antes de presentar, tocar
"Restablecer demo".
