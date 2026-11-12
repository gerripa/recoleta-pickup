# Actualización: versión final (12/11)

App publicada: https://gerripa-recoleta-pic-v18s.bolt.host

## Cambios pedidos por los profesores (entrega final)

| Pedido | Qué hicimos | Dónde verlo |
|---|---|---|
| Integración con Tiendanube: ¿adentro o redirigiendo? | Todo pasa **dentro de Tiendanube**, sin redirigir. El retiro es una opción de envío de Tiendanube y el descuento lo agrega la app antes de pagar con la API de Descuentos. El link a nuestra página queda solo para WhatsApp e Instagram. | Panel → Conexión Tiendanube |
| Cómo y cuándo se aplican los descuentos y los pedidos | Paso a paso de la compra (carrito → descuento → pago → webhook → código) y tabla de cuándo se aplica cada beneficio. Si el cliente no inició sesión, usa un cupón personal de un solo uso que le llega por mail. | Conexión Tiendanube · Beneficios |
| Precios conectados a Tiendanube | Precios y stock se leen de Tiendanube (simulado), con botón de sincronizar. El stock baja con cada venta y no se puede vender sin stock. | Productos y stock |
| Más ayuda para Martín: stock y métricas | Alerta de stock bajo con mínimo configurable por producto, unidades vendidas para retirar, y una página de métricas: ventas, ticket promedio, clientes que vuelven, envíos ahorrados, retiro a tiempo, productos más vendidos, ventas por canal y días con más retiros. | Resumen · Productos y stock · Métricas |
| El estado cambia solo al cargar el código | Martín carga el código y el pedido avanza solo: pendiente → en preparación → listo → entregado. Avisa si no está pago, si ya se entregó o si el código no existe, y se puede deshacer. | Resumen · Pedidos |
| Código de retiro más corto | Ahora son **4 números** (por ejemplo, 4827), fáciles de decir en el mostrador. | Confirmación · mails |
| No cerrar días con pedidos por retirar | No deja cerrar un día de la semana ni una fecha si hay pedidos que se pueden retirar ese día, y muestra cuáles son. | Local y horario |
| Bloquear días puntuales (feriados) | Se bloquean fechas sueltas con motivo, sin cerrar todas las semanas. El cliente las ve y el plazo de retiro las saltea. | Local y horario |

Todo sigue con datos ficticios guardados en el navegador. La conexión real (Tiendanube, mails y Supabase) es la siguiente etapa, con Claude Code y las tareas ODD.

---


<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>ITBA · IA APLICADA A NEGOCIOS · TP3</strong></p>
<p><strong>PRD</strong></p>
<p><strong>Recoleta PickUp</strong></p>
<p>Retiro en el local con beneficios, integrado en la compra</p>
<p>Versión 2.1 · 6 de noviembre de 2026</p>
<p><strong>PROPUESTA PENDIENTE DE VALIDACIÓN CON LA
EMPRESA</strong></p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>¿Qué es este documento?</strong></p>
<p>Un PRD (documento de requerimientos de producto) explica qué se va a
construir, para quién, con qué reglas y cómo se comprueba que funciona.
Es la guía para programar la herramienta.</p></td>
</tr>
</tbody>
</table>

**EN UNA MIRADA**

<table>
<colgroup>
<col style="width: 31%" />
<col style="width: 2%" />
<col style="width: 31%" />
<col style="width: 2%" />
<col style="width: 31%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>QUÉ CONSTRUIMOS</strong></p>
<p><strong>Retiro con beneficios dentro de la compra</strong></p>
<p>El cliente elige retirar antes de pagar, pone su email y ve lo que le
toca. No elige horario.</p></td>
<td></td>
<td><p><strong>PARA QUIÉN</strong></p>
<p><strong>Cliente y administrador</strong></p>
<p>El cliente ahorra y no tiene que usar otra app. El negocio organiza
todo desde un panel.</p></td>
<td></td>
<td><p><strong>CÓMO SABREMOS QUE SIRVE</strong></p>
<p><strong>Menos coordinación, más recompra</strong></p>
<p>Medimos tiempo por retiro, compras con retiro y clientes que
vuelven.</p></td>
</tr>
</tbody>
</table>

**CONTENIDO**

<table>
<colgroup>
<col style="width: 47%" />
<col style="width: 4%" />
<col style="width: 47%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>01</strong> Problema y objetivo</p>
<p><strong>02</strong> Usuarios y recorrido</p>
<p><strong>03</strong> Beneficios para el cliente</p>
<p><strong>04</strong> Alcance de la primera versión</p>
<p><strong>05</strong> Requerimientos funcionales</p>
<p><strong>06</strong> Reglas de negocio</p></td>
<td></td>
<td><p><strong>07</strong> Datos, arquitectura y seguridad</p>
<p><strong>08</strong> Mails automáticos</p>
<p><strong>09</strong> Pruebas y criterios de aceptación</p>
<p><strong>10</strong> Métricas de valor</p>
<p><strong>11</strong> Implementación y pendientes</p></td>
</tr>
</tbody>
</table>

**01 Problema y objetivo**

*Las entregas dependen de que alguien esté presente, y retirar hoy no le
da nada extra al cliente.*

Recoleta al Fallo vende suplementos deportivos por Tiendanube, WhatsApp
e Instagram. Un responsable nos indicó que **la entrega de pedidos
requiere su presencia física**. Además, la empresa está por abrir un
local, lo que vuelve importante ordenar la preparación y los retiros.

<table>
<colgroup>
<col style="width: 48%" />
<col style="width: 2%" />
<col style="width: 48%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>OBJETIVO</strong></p>
<p><strong>Retiros organizados que le convengan al cliente</strong></p>
<p>Que el cliente elija retirar dentro de la compra, antes de pagar,
porque ahí ve un beneficio. Y que el negocio organice todos los retiros
en un panel.</p></td>
<td></td>
<td><p><strong>LO QUE NO BUSCA</strong></p>
<p><strong>Otra app para el cliente</strong></p>
<p>El cliente no descarga ni usa nada aparte: todo pasa en la compra y
le llega por mail. Tampoco reemplaza a quien entrega.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Qué cambió respecto de la versión 1</strong></p>
<p>Los profesores nos pidieron que la herramienta también beneficie al
cliente. Por eso el retiro se elige antes de pagar y trae beneficios que
cambian según el historial del cliente, identificado por su email.
Además, el cliente no elige día ni horario: el local está abierto y
siempre hay alguien atendiendo, así que pasa cuando quiere dentro del
horario.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Todavía no sabemos</strong></p>
<p>Cuántos retiros hacen, cuánto tiempo lleva coordinarlos, qué
beneficios puede costear la empresa y el horario real del local. Lo
vamos a relevar (ver sección 11).</p></td>
</tr>
</tbody>
</table>

**02 Usuarios y recorrido**

*Dos usuarios y un ciclo de seis pasos que se repite en cada compra.*

<table>
<colgroup>
<col style="width: 48%" />
<col style="width: 2%" />
<col style="width: 48%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>CLIENTE</strong></p>
<p><strong>Necesita</strong></p>
<p>Comprar rápido, saber dónde y en qué horario retirar, y que le
convenga hacerlo, sin usar otra aplicación.</p></td>
<td></td>
<td><p><strong>ADMINISTRADOR</strong></p>
<p><strong>Necesita</strong></p>
<p>Saber qué preparar y cuánta gente va a pasar, tener todos los pedidos
anotados, entregar con seguridad y decidir qué beneficios
ofrece.</p></td>
</tr>
</tbody>
</table>

**El recorrido completo**

<img src="media/a1c7fc95c3db840283c275380e87f3899d338d05.png"
style="width:6.6875in;height:2.91667in" />

Por WhatsApp o Instagram, el responsable carga el pedido y le manda al
cliente un enlace. Desde ahí el cliente hace los pasos 2 y 3 igual que
en la tienda online.

**03 Beneficios para el cliente**

*La página reconoce el email y decide sola qué le toca. Puede ser un
descuento, un regalo o nada.*

| **BENEFICIO**          | **CUÁNDO APARECE**                             | **QUÉ RECIBE**                              |
|------------------------|------------------------------------------------|---------------------------------------------|
| **Tarjeta de retiros** | En su 5.º retiro (cuentan solo los entregados) | 20 % off en esa compra                      |
| **Recompra**           | Vuelve a comprar un producto que ya retiró     | 10 % off en esa compra                      |
| **Primer retiro**      | Primera vez que retira con ese email           | Una muestra de regalo                       |
| **Compra grande**      | El carrito supera un monto (ej.: \$ 60.000)    | Un regalo (ej.: shaker)                     |
| **Ninguno**            | No cumple ninguna condición                    | Ve cuántos retiros le faltan para su premio |

**Siempre:** retirando no paga envío y su pedido lo espera listo.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Valores de ejemplo</strong></p>
<p>Los porcentajes, montos y regalos son ejemplos para el prototipo. El
administrador los activa, desactiva y cambia desde el panel según lo que
la empresa pueda costear.</p></td>
</tr>
</tbody>
</table>

**04 Alcance de la primera versión (MVP)**

*Qué entra y qué queda afuera, para que la primera versión sea
realizable.*

<table>
<colgroup>
<col style="width: 48%" />
<col style="width: 2%" />
<col style="width: 48%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>INCLUIDO</strong></p>
<p><strong>✓</strong> Opción de retiro dentro del checkout y en el
enlace para WhatsApp e Instagram</p>
<p><strong>✓</strong> Datos del local: dirección, días, horario y plazo
para retirar</p>
<p><strong>✓</strong> Email obligatorio como ID del cliente</p>
<p><strong>✓</strong> Motor de beneficios configurable</p>
<p><strong>✓</strong> Tarjeta de retiros y descuento por recompra</p>
<p><strong>✓</strong> Mails automáticos por estado del pedido</p>
<p><strong>✓</strong> Entrega validando el código de retiro</p>
<p><strong>✓</strong> Panel con pedidos, beneficios, mails y
métricas</p></td>
<td></td>
<td><p><strong>NO INCLUIDO EN LA VERSIÓN 1</strong></p>
<p><strong>✕</strong> Integración real con el checkout de Tiendanube (a
validar técnicamente)</p>
<p><strong>✕</strong> Envío real de mails (servicio a definir)</p>
<p><strong>✕</strong> Pagos reales</p>
<p><strong>✕</strong> Mensajes automáticos por WhatsApp</p>
<p><strong>✕</strong> Turnos u horarios elegidos por el cliente</p>
<p><strong>✕</strong> Gestión de inventario</p></td>
</tr>
</tbody>
</table>

**05 Requerimientos funcionales**

*Lo que el sistema tiene que hacer, y cómo comprobamos que está bien
hecho.*

| **ID**    | **QUIÉN**   | **QUÉ TIENE QUE HACER**                                        | **CÓMO SABEMOS QUE ESTÁ BIEN**                      |
|-----------|-------------|----------------------------------------------------------------|-----------------------------------------------------|
| **RF-01** | **ADMIN**   | Configurar dirección, días, horario y plazo para retirar.      | El cliente ve esos datos al elegir retiro.          |
| **RF-02** | **CLIENTE** | Elegir retiro y poner su email antes de pagar.                 | Sin email válido no puede continuar.                |
| **RF-03** | **SISTEMA** | Mostrar dirección, horario y plazo para retirar.               | Se ven en el checkout, en el enlace y en los mails. |
| **RF-04** | **SISTEMA** | Calcular los beneficios según el historial del email.          | Muestra el beneficio correcto, o ninguno.           |
| **RF-05** | **SISTEMA** | Aplicar el descuento al total antes del pago.                  | El total pagado coincide con el total mostrado.     |
| **RF-06** | **ADMIN**   | Activar y configurar las reglas de beneficios.                 | Los cambios se aplican a las compras nuevas.        |
| **RF-07** | **SISTEMA** | Enviar mails automáticos según el estado del pedido.           | Cada cambio de estado genera su mail.               |
| **RF-08** | **ADMIN**   | Registrar pedidos de WhatsApp o Instagram y generar el enlace. | El enlace abre la reserva de ese pedido.            |
| **RF-09** | **ADMIN**   | Marcar pedidos como listos y entregarlos validando el código.  | Sin el código correcto no se entrega.               |
| **RF-10** | **ADMIN**   | Ver qué preparar, quiénes pueden pasar, vencidos y métricas.   | Los números coinciden con los pedidos.              |

**06 Reglas de negocio**

*Nueve reglas que el sistema siempre respeta, incluidas las que evitan
abusos.*

<table>
<colgroup>
<col style="width: 31%" />
<col style="width: 2%" />
<col style="width: 31%" />
<col style="width: 2%" />
<col style="width: 31%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>RN-01</strong></p>
<p><strong>Plazo para retirar</strong></p>
<p>El pedido espera listo un plazo (ej.: 7 días). Antes de vencer, llega
un recordatorio.</p></td>
<td></td>
<td><p><strong>RN-02</strong></p>
<p><strong>Sin turnos</strong></p>
<p>El cliente pasa en el horario del local; no elige día ni
hora.</p></td>
<td></td>
<td><p><strong>RN-03</strong></p>
<p><strong>Solo el administrador modifica</strong></p>
<p>Datos del local, beneficios y estados requieren login.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 31%" />
<col style="width: 2%" />
<col style="width: 31%" />
<col style="width: 2%" />
<col style="width: 31%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>RN-04</strong></p>
<p><strong>El email es el ID</strong></p>
<p>Es obligatorio para retirar y une todas las compras del
cliente.</p></td>
<td></td>
<td><p><strong>RN-05</strong></p>
<p><strong>Los descuentos no se suman</strong></p>
<p>Se aplica el mayor. Los regalos sí se acumulan.</p></td>
<td></td>
<td><p><strong>RN-06</strong></p>
<p><strong>Suma solo lo entregado</strong></p>
<p>Un retiro suma a la tarjeta cuando se entrega con el código.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 31%" />
<col style="width: 2%" />
<col style="width: 31%" />
<col style="width: 2%" />
<col style="width: 31%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>RN-07</strong></p>
<p><strong>Vencido no suma</strong></p>
<p>Si pasa el plazo sin retirar, queda "Vencido" y no suma.</p></td>
<td></td>
<td><p><strong>RN-08</strong></p>
<p><strong>Promos con permiso</strong></p>
<p>El aviso de recompra solo se envía si el cliente aceptó.</p></td>
<td></td>
<td><p><strong>RN-09</strong></p>
<p><strong>Privacidad</strong></p>
<p>Nunca se muestran datos de otros clientes.</p></td>
</tr>
</tbody>
</table>

**07 Datos, arquitectura y seguridad**

*Cómo está armado por dentro y cómo se protegen los datos.*

<img src="media/74405df92126d61d634f5e3c12b826a143c052e8.png"
style="width:6.6875in;height:2.38542in" />

**Las tablas de la base de datos**

| **TABLA**                  | **PARA QUÉ SIRVE**           | **QUÉ GUARDA**                                                     |
|----------------------------|------------------------------|--------------------------------------------------------------------|
| **clientes**               | Identificar a cada cliente   | Email (ID), nombre y si acepta promos                              |
| **pedidos**                | Cada compra                  | Número, canal, productos, total, descuento y beneficios aplicados  |
| **retiros**                | Cada retiro                  | Pedido, código, estado, fecha en que quedó listo y fecha de retiro |
| **reglas_beneficios**      | Qué beneficios están activos | Tipo, condición, porcentaje o regalo, activo sí/no                 |
| **mensajes**               | Mails enviados y programados | Pedido, tipo de mail, fecha y estado del envío                     |
| **perfiles_administrador** | Quién puede gestionar        | Usuario y rol                                                      |

**Datos del local:** dirección, días y horario de atención, y plazo para
retirar. Los configura el administrador.

**Medidas de seguridad**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>● RLS activado en todas las tablas: cada usuario solo accede a lo
que le corresponde.</p>
<p>● Los beneficios y los estados se validan en el servidor, no en el
navegador.</p>
<p>● Ninguna clave privada queda expuesta en el navegador.</p>
<p>● Datos ficticios hasta validar reglas y seguridad.</p>
<p>● Auditoría de Bolt antes de publicar.</p></td>
</tr>
</tbody>
</table>

**08 Mails automáticos**

*El cliente no tiene que hacer nada: la página le avisa según el estado
de su pedido.*

<img src="media/95c3e783157381760c82a8f1331d0b6db0960e21.png"
style="width:6.6875in;height:1.21875in" />

En el prototipo los mails se muestran como vista previa y no se envían.
El servicio de envío real está pendiente de definir.

**09 Pruebas y criterios de aceptación**

*Diez pruebas que la herramienta tiene que pasar antes de usarse.*

| **PRUEBA**                                                | **RESULTADO ESPERADO**                                         | **QUÉ VERIFICA** |
|-----------------------------------------------------------|----------------------------------------------------------------|------------------|
| **Compra sin email válido**                               | No deja continuar.                                             | RF-02 · RN-04    |
| **Cliente elige retiro**                                  | Ve dirección, horario y plazo; no elige turno.                 | RF-03 · RN-02    |
| **Cliente en su 5.º retiro**                              | Aparece el 20 % off antes de pagar.                            | RF-04 · RF-05    |
| **Le tocan dos descuentos**                               | Se aplica solo el mayor.                                       | RN-05            |
| **Entrega con código incorrecto**                         | No se entrega ni suma a la tarjeta.                            | RF-09 · RN-06    |
| **Pedido listo que no retiran**                           | Llega un recordatorio y, al vencer, queda "Vencido" y no suma. | RN-01 · RN-07    |
| **Marcar un pedido como listo**                           | El cliente recibe el mail "pedido listo".                      | RF-07 · RF-09    |
| **Cliente sin permiso de promos**                         | No recibe aviso de recompra.                                   | RN-08            |
| **Acceso sin permisos al panel**                          | Acceso denegado.                                               | RN-03            |
| **Recorrido completo, de la compra al aviso de recompra** | Se completa sin inconsistencias.                               | Todo el flujo    |

**10 Métricas de valor**

*Medimos el ahorro de tiempo del negocio y si los beneficios hacen que
el cliente vuelva.*

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
<td><p><strong>INDICADOR PRINCIPAL</strong></p>
<p><strong>Minutos de coordinación por retiro</strong></p>
<p>Antes vs. después de usar PickUp. Esperamos que baje.</p></td>
<td></td>
<td><p><strong>COMPLEMENTARIO</strong></p>
<p><strong>Tasa de recompra</strong></p>
<p>% de clientes que vuelven a comprar con retiro.</p></td>
<td></td>
<td><p><strong>COMPLEMENTARIO</strong></p>
<p><strong>% de compras con retiro</strong></p>
<p>Muestra si los beneficios hacen elegir retiro.</p></td>
</tr>
</tbody>
</table>

| **TAMBIÉN MEDIMOS**              | **PARA QUÉ**                                       |
|----------------------------------|----------------------------------------------------|
| **Retiros con beneficio**        | Cuántas compras recibieron algo y de qué tipo.     |
| **Descuento otorgado**           | El costo de los beneficios para el negocio.        |
| **Ventas por recompra**          | Lo que vuelve gracias a la tarjeta y a los avisos. |
| **Pedidos vencidos sin retirar** | Si los clientes pasan a buscar a tiempo.           |

**Cómo calculamos el valor**

<img src="media/719f53b7117d850d8d98cd5c605f6f4114ffae80.png"
style="width:6.25in;height:0.61458in" />

**Y para los beneficios:** ventas por recompra − descuento otorgado =
aporte de los beneficios. Si el resultado es positivo, los beneficios se
pagan solos.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Importante</strong></p>
<p>No afirmamos ningún ahorro ni ganancia todavía. Las metas se fijan
cuando la empresa aporte una línea de base y después de una prueba
piloto.</p></td>
</tr>
</tbody>
</table>

**11 Implementación prevista y pendientes**

*Seis etapas, de validar la idea con la empresa a medir el resultado.*

<img src="media/ae9cb4d884bd11807d0d09ed4317a263a0bd8c4f.png"
style="width:6.6875in;height:2.13542in" />

**Pendiente de definir con el responsable**

☐ Con qué frecuencia hay retiros y cómo se coordinan hoy

☐ Qué beneficios puede costear la empresa y con qué valores

☐ Cómo integrar la opción de retiro y el descuento en el checkout real
de Tiendanube

☐ Qué servicio se usa para enviar los mails

☐ Dirección, días, horario y plazo de retiro reales del local

☐ Texto del permiso para recibir promociones

**Palabras que usamos**

| **TÉRMINO**             | **QUÉ SIGNIFICA**                                                                            |
|-------------------------|----------------------------------------------------------------------------------------------|
| **MVP**                 | Primera versión mínima que ya sirve y se puede probar con usuarios reales.                   |
| **Checkout**            | La pantalla donde el cliente termina la compra y paga.                                       |
| **Motor de beneficios** | La parte del sistema que decide qué beneficio le toca a cada compra.                         |
| **Tarjeta de retiros**  | El conteo de retiros entregados de un cliente; al completarla recibe un premio.              |
| **Permiso de promos**   | La casilla donde el cliente acepta recibir avisos y promociones.                             |
| **Supabase y RLS**      | Servicio que guarda los datos, y las reglas que deciden quién puede ver o cambiar cada dato. |
| **Línea de base**       | Cómo funcionan las cosas hoy, medido antes del cambio, para comparar después.                |
