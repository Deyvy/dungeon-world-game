# Especificación de Requisitos: Listado y Hoja Interactiva de Personaje (Dungeon World)

## 1. Visión General
Este documento define los requisitos funcionales y de interfaz para el sistema posterior a la creación de personajes en **Dungeon World (DW)**. Contempla dos pantallas principales:
1. **Listado de Personajes (Dashboard/Roster):** Punto de acceso para gestionar, seleccionar o crear nuevos personajes.
2. **Hoja Interactiva de Juego (Playable Character Sheet):** Interfaz dinámica para controlar la ficha durante las sesiones de juego, gestionando estado vital, tiradas, inventario, debilidades y movimientos.

---

## 2. Módulo 1: Listado de Personajes (Roster View)

### 2.1 Requisitos de Interfaz (UI)
- **Vista principal:** Rejilla (*grid*) o lista de tarjetas (*cards*) con todos los personajes creados por el usuario.
- **Información visible en cada tarjeta:**
  - Nombre del personaje.
  - Clase y Raza.
  - Nivel y Experiencia actual (`PX / Nivel + 7`).
  - Barra de Salud (`PG Actuales / PG Máximos`).
  - Alineamiento.
- **Acciones disponibles:**
  - **Botonera Principal:** "Crear Nuevo Personaje" (redirige al Wizard de Creación).
  - **Clic en Tarjeta:** Seleccionar y abrir la Hoja Interactiva de Juego.
  - **Menú secundario por tarjeta:** 
    - Duplicar personaje.
    - Eliminar personaje (requiere modal de confirmación).
---

## 3. Módulo 2: Hoja Interactiva de Juego (Play Mode Sheet)

La hoja de personaje debe organizarse en bloques o pestañas modulares para facilitar la consulta rápida durante la partida.

### 3.1 Cabecera y Estado Vital
- **Identidad:** Nombre, Clase, Raza, Nivel y Alineamiento.
- **Barra de Puntos de Golpe (PG):**
  - Muestra `PG Actuales / PG Máximos`.
  - Botones de acceso rápido para restar PG, otro para curar PG y campo numérico editable entre ambos botones.
  - **Alerta de Estado:** Si PG llega a `0`, muestra un pill al lado de la barra de PG notificando el movimiento obligatorio **Último Aliento**.
- **Contador de Experiencia (PX):**
  - Muestra campo numérico con los PX actuales.
  - **Subida de Nivel:** Si `PX >= Nivel + 7`, se habilita el botón "Subir de Nivel" para seleccionar un nuevo movimiento avanzado y subir atributos.
- **Indicadores Rápidos:** Armadura total calculada, Carga actual vs. Carga máxima.

### 3.2 Atributos
- **Visualización de los 6 Atributos:** FUE, DES, CON, INT, SAB, CAR.
- **Cálculo dinámico:** Muestra el valor numérico base y el modificador (`-3` a `+3`).

### 3.3 Estado de Salud y Debilidades
Checkboxes para marcar las 6 debilidades oficiales de DW:
1. **Debilitado** Aplica `-1` a la FUE.
2. **Tembloroso** Aplica `-1` a la DES.
3. **Enfermo** Aplica `-1` a la CON.
4. **Aturdido** Aplica `-1` a la INT.
5. **Confundido** Aplica `-1` a la SAB.
6. **Marcado** Aplica `-1` al CAR.

*Lógica de negocio:* Aplicar el penalizador de `-1` al modificador efectivo del atributo de forma automática mientras la debilidad esté activa.

### 3.4 Movimientos (Clase y Globales)
- **Movimientos Globales Básico:** *Saja-Raja, Desafiar el Peligro, Discernir la Realidad, 
Exhibir Conocimientos, Disparar, Defender, Lanzar Conjuro o Ayudar*.
- **Movimientos de Clase:** Lista con los movimientos iniciales y avanzados seleccionados por el jugador.
- **Interacción:** Al pulsar un movimiento, se despliega la descripción completa, las opciones elegidas, los desencadenantes narrativos y/o las opciones disponibles para resultados de -6, 7-9 y 10+.

### 3.5 Inventario, Carga y Equipo
- **Listado de Objetos:** Muestra armas, armaduras, consumibles y tesoro.
- **Gestión de Consumibles:** Botones para decrementar usos en objetos que tengan cantidad (ej. Raciones de viaje, Fajos de flechas, Equipo de aventurero).
- **Control de Carga:** Suma automática del peso de todos los objetos en el inventario.
  - Si `Carga Actual > Carga Máxima`, muestra un pill en el inventario de **Impedimenta** (penalización -1 a todas las tiradas).
- **Gestión de Monedas:** Contador numérico de Monedas de Oro (Monedas).

### 3.6 Gestión de Conjuros (Mago, Clérigo y clases mágicas)
- **Libro de Conjuros / Peticiones Divinas:** Muestra todos los conjuros conocidos.
- **Selector de Conjuros Preparados:**
  - Permite marcar qué conjuros están preparados para el día.
  - Validar que la suma de niveles de los conjuros preparados no supere `Nivel + 1`.
- **Estado de Conjuros Mantenidos:** Checkbox para indicar si un conjuro sigue activo en el tiempo, aplicando un penalizador de `-1` a la tirada de lanzar nuevos conjuros.

### 3.7 Vínculos (*Bonds*)
- Campos de texto editables con las frases de vínculo.
- Botón para añadir un nuevo vínculo.
- Botón de resolución de vínculo para marcar PX.

---

## 4. Persistencia y Sincronización
- Guardado automático (*autosave*) en estado local o base de datos tras modificar PG, PX, inventario, debilidades o conjuros preparados.
- Soporte para restaurar el estado completo de la ficha al recargar la aplicación o volver desde el listado. (En este caso, será respaldado en la base de datos).
