<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>ITBA · IA APLICADA A NEGOCIOS · TP3</strong></p>
<p><strong>Tareas ODD</strong></p>
<p><strong>Recoleta PickUp</strong></p>
<p>El desarrollo dividido en tareas chicas para construir la app con
IA</p></td>
</tr>
</tbody>
</table>

**El desarrollo se divide en 27 tareas, agrupadas en 7 fases.** Cada
tarea es chica, cita lo que pide el PRD y tiene un resultado que se
puede comprobar ("Listo cuando"). Así Claude Code trabaja de a una tarea
por vez y es fácil revisar que esté bien.

<table style="width:100%;">
<colgroup>
<col style="width: 32%" />
<col style="width: 1%" />
<col style="width: 32%" />
<col style="width: 1%" />
<col style="width: 32%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>27</strong></p>
<p>tareas en total</p></td>
<td></td>
<td><p><strong>15</strong></p>
<p>ya resueltas en el prototipo, con datos ficticios</p></td>
<td></td>
<td><p><strong>12</strong></p>
<p>pendientes: datos reales, servidor, mails, integración y
piloto</p></td>
</tr>
</tbody>
</table>

**Las fases**

<img src="media/7b365868e8a0fad0cfcc4f26fb64b3874d277b70.png"
style="width:6.6875in;height:0.96875in" />

**Cómo se trabaja cada tarea**

<img src="media/17b65a5a55a68ff38c65201c3f01e1afed3994b3.png"
style="width:6.6875in;height:0.84375in" />

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Instrucción para Claude Code en cada tarea</strong></p>
<p>Leé docs/PRD.md y docs/TASKS.md. Hacé solo la tarea T-XX.</p>
<p>No cambies otras partes. Al terminar, probá que se cumple el</p>
<p>"Listo cuando" y mostrame el resultado. Usá datos ficticios.</p></td>
</tr>
</tbody>
</table>

**Referencias:** RF = requerimiento funcional y RN = regla de negocio,
según el PRD v2.1. **PROTOTIPO** ya funciona en la demo con datos
ficticios. **PENDIENTE** falta hacerlo.

**FASE 0 Preparación**

| **ID**   | **TAREA**                                                                          | **LISTO CUANDO**                         | **DEPENDE** | **ESTADO**    |
|----------|------------------------------------------------------------------------------------|------------------------------------------|-------------|---------------|
| **T-01** | **Crear el repositorio en GitHub y guardar el PRD en docs/PRD.md**                 | El repo tiene README y docs/PRD.md.      | —           | **PENDIENTE** |
| **T-02** | **Armar el proyecto (React + TypeScript + Tailwind, Vite) a partir del prototipo** | La app abre con npm run dev sin errores. | T-01        | **PROTOTIPO** |
| **T-03** | **Crear el proyecto en Supabase y cargar datos ficticios**                         | Hay datos de prueba y ninguno es real.   | T-01        | **PENDIENTE** |

**FASE 1 Datos y seguridad**

<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 33%" />
<col style="width: 29%" />
<col style="width: 14%" />
<col style="width: 14%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>ID</strong></th>
<th><strong>TAREA</strong></th>
<th><strong>LISTO CUANDO</strong></th>
<th><strong>DEPENDE</strong></th>
<th><strong>ESTADO</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>T-04</strong></td>
<td><p><strong>Crear las 6 tablas</strong></p>
<p>PRD sección 07</p></td>
<td>Existen clientes, pedidos, reservas, reglas_beneficios, mensajes y
perfiles_administrador.</td>
<td>T-03</td>
<td><strong>PENDIENTE</strong></td>
</tr>
<tr class="even">
<td><strong>T-05</strong></td>
<td><p><strong>Activar RLS y escribir las políticas</strong></p>
<p>RN-09</p></td>
<td>Sin login no se pueden leer reservas ni clientes.</td>
<td>T-04</td>
<td><strong>PENDIENTE</strong></td>
</tr>
<tr class="odd">
<td><strong>T-06</strong></td>
<td><p><strong>Login del administrador con Supabase Auth</strong></p>
<p>RN-03</p></td>
<td>Sin login no se entra al panel.</td>
<td>T-04</td>
<td><strong>PENDIENTE</strong></td>
</tr>
</tbody>
</table>

**FASE 2 Retiros**

<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 33%" />
<col style="width: 29%" />
<col style="width: 14%" />
<col style="width: 14%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>ID</strong></th>
<th><strong>TAREA</strong></th>
<th><strong>LISTO CUANDO</strong></th>
<th><strong>DEPENDE</strong></th>
<th><strong>ESTADO</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>T-07</strong></td>
<td><p><strong>Configurar dirección, días, horario y plazo para
retirar</strong></p>
<p>RF-01</p></td>
<td>El cliente ve esos datos al elegir retiro.</td>
<td>T-06</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="even">
<td><strong>T-08</strong></td>
<td><p><strong>Opción de retiro con email en el checkout y en el
enlace</strong></p>
<p>RF-02 · RF-03 · RN-02</p></td>
<td>Sin email no se puede seguir. Se ven dirección, horario y plazo; no
se elige turno.</td>
<td>T-07</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="odd">
<td><strong>T-09</strong></td>
<td><p><strong>Guardar el pedido con retiro en el servidor</strong></p>
<p>RF-02</p></td>
<td>El pedido queda con código y estado "pendiente".</td>
<td>T-08</td>
<td><strong>PENDIENTE</strong></td>
</tr>
<tr class="even">
<td><strong>T-10</strong></td>
<td><p><strong>Pedido manual de WhatsApp o Instagram con
enlace</strong></p>
<p>RF-08</p></td>
<td>El enlace abre la confirmación de retiro de ese pedido.</td>
<td>T-08</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
</tbody>
</table>

**FASE 3 Beneficios**

<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 33%" />
<col style="width: 29%" />
<col style="width: 14%" />
<col style="width: 14%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>ID</strong></th>
<th><strong>TAREA</strong></th>
<th><strong>LISTO CUANDO</strong></th>
<th><strong>DEPENDE</strong></th>
<th><strong>ESTADO</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>T-11</strong></td>
<td><p><strong>Motor de beneficios según el email (en el
servidor)</strong></p>
<p>RF-04 · RN-04 · RN-05</p></td>
<td>5.º retiro: 20 % off. Dos descuentos: solo el mayor. Sin condición:
ninguno.</td>
<td>T-09</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="even">
<td><strong>T-12</strong></td>
<td><p><strong>Aplicar el descuento al total antes del pago</strong></p>
<p>RF-05</p></td>
<td>El total mostrado es igual al total pagado.</td>
<td>T-11</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="odd">
<td><strong>T-13</strong></td>
<td><p><strong>Pantalla para activar y configurar las
reglas</strong></p>
<p>RF-06</p></td>
<td>Un cambio se aplica a las compras nuevas.</td>
<td>T-11</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="even">
<td><strong>T-14</strong></td>
<td><p><strong>Tarjeta de retiros del cliente</strong></p>
<p>RN-06</p></td>
<td>Solo suman los retiros entregados.</td>
<td>T-16</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
</tbody>
</table>

**FASE 4 Operación**

<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 33%" />
<col style="width: 29%" />
<col style="width: 14%" />
<col style="width: 14%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>ID</strong></th>
<th><strong>TAREA</strong></th>
<th><strong>LISTO CUANDO</strong></th>
<th><strong>DEPENDE</strong></th>
<th><strong>ESTADO</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>T-15</strong></td>
<td><p><strong>Panel: qué preparar, quiénes pueden pasar y todos los
pedidos</strong></p>
<p>RF-09 · RF-10</p></td>
<td>Se ve cuántos hay para preparar y cuántos esperan retiro; filtra por
canal y estado.</td>
<td>T-09</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="even">
<td><strong>T-16</strong></td>
<td><p><strong>Entrega validando el código de retiro</strong></p>
<p>RF-09 · RN-06</p></td>
<td>Con un código incorrecto no se entrega.</td>
<td>T-15</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="odd">
<td><strong>T-17</strong></td>
<td><p><strong>Marcar pedidos vencidos sin retirar</strong></p>
<p>RN-01 · RN-07</p></td>
<td>Pasado el plazo queda "Vencido" y no suma.</td>
<td>T-15</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="even">
<td><strong>T-18</strong></td>
<td><strong>Confirmar el pago de los pedidos manuales</strong></td>
<td>El panel muestra pagado o pendiente.</td>
<td>T-10</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
</tbody>
</table>

**FASE 5 Mails**

<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 33%" />
<col style="width: 29%" />
<col style="width: 14%" />
<col style="width: 14%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>ID</strong></th>
<th><strong>TAREA</strong></th>
<th><strong>LISTO CUANDO</strong></th>
<th><strong>DEPENDE</strong></th>
<th><strong>ESTADO</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>T-19</strong></td>
<td><p><strong>Plantillas de los 5 mails</strong></p>
<p>PRD sección 08</p></td>
<td>Confirmación, pedido listo, recordatorio, gracias y aviso de
recompra.</td>
<td>T-11</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="even">
<td><strong>T-20</strong></td>
<td><strong>Elegir e integrar el servicio de envío de
mails</strong></td>
<td>Llega un mail de prueba a una casilla del equipo.</td>
<td>T-19</td>
<td><strong>PENDIENTE</strong></td>
</tr>
<tr class="odd">
<td><strong>T-21</strong></td>
<td><p><strong>Enviar cada mail según el estado del pedido</strong></p>
<p>RF-07</p></td>
<td>Cada cambio de estado genera su mail.</td>
<td>T-20</td>
<td><strong>PENDIENTE</strong></td>
</tr>
<tr class="even">
<td><strong>T-22</strong></td>
<td><p><strong>Permiso para recibir promociones</strong></p>
<p>RN-08</p></td>
<td>Sin permiso no se envía el aviso de recompra.</td>
<td>T-19</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
</tbody>
</table>

**FASE 6 Métricas y cierre**

<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 33%" />
<col style="width: 29%" />
<col style="width: 14%" />
<col style="width: 14%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>ID</strong></th>
<th><strong>TAREA</strong></th>
<th><strong>LISTO CUANDO</strong></th>
<th><strong>DEPENDE</strong></th>
<th><strong>ESTADO</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>T-23</strong></td>
<td><p><strong>Métricas de impacto en el panel</strong></p>
<p>RF-10</p></td>
<td>Los números coinciden con los pedidos.</td>
<td>T-14</td>
<td><strong>PROTOTIPO</strong></td>
</tr>
<tr class="even">
<td><strong>T-24</strong></td>
<td><p><strong>Correr las 10 pruebas de aceptación del PRD</strong></p>
<p>PRD sección 09</p></td>
<td>Las 10 pruebas pasan.</td>
<td>Todas</td>
<td><strong>PENDIENTE</strong></td>
</tr>
<tr class="odd">
<td><strong>T-25</strong></td>
<td><strong>Auditoría de seguridad</strong></td>
<td>No hay claves en el navegador ni en el repositorio.</td>
<td>T-05</td>
<td><strong>PENDIENTE</strong></td>
</tr>
<tr class="even">
<td><strong>T-26</strong></td>
<td><strong>Integración con el checkout real de Tiendanube (a
validar)</strong></td>
<td>Una compra de prueba muestra la opción de retiro y aplica el
descuento.</td>
<td>T-12</td>
<td><strong>PENDIENTE</strong></td>
</tr>
<tr class="odd">
<td><strong>T-27</strong></td>
<td><strong>Prueba piloto y medición</strong></td>
<td>Hay línea de base y medición posterior.</td>
<td>T-24</td>
<td><strong>PENDIENTE</strong></td>
</tr>
</tbody>
</table>
