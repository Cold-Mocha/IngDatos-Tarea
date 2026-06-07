# IngDatos-Tarea — Scripts BrainRot Analytics (MongoDB)

Base de datos: `brainrot_analytics`

## Orden de ejecución

| # | Archivo | Qué hace | Persiste |
|---|---------|----------|----------|
| 1 | `00_limpieza_raw_to_clean.js` | Limpieza RAW → CLEAN de las 3 colecciones | ✅ crea `clean_*` |
| 2 | `indices_estrategia.js` | Crea los 4 índices + explain antes/después | ✅ crea índices |
| 3 | `resumen_1_scorecard_global.js` | Scorecard global de KPIs | ✅ `resumen_scorecard_global` |
| 4 | `resumen_2_distribucion_riesgo_consumo.js` | Matriz consumo × nivel de adicción | ✅ `resumen_matriz_consumo_nivel` |
| 5 | `aggregation_1_tiempo_pantalla_grupo_etario_plataforma.js` | Tiempo de pantalla por grupo etario y plataforma | ❌ |
| 6 | `aggregation_2_consumo_nocturno_sueno_adiccion.js` | Uso nocturno y calidad de sueño vs adicción | ❌ |
| 7 | `aggregation_3_consumo_total_vs_atencion.js` | Consumo total diario vs capacidad de atención | ❌ |
| – | `consultas_frecuentes.js` | Las 5 consultas pequeñas de los índices (con y sin explain) | ❌ |

## Cómo ejecutar

```bash
mongosh brainrot_analytics 00_limpieza_raw_to_clean.js
mongosh brainrot_analytics indices_estrategia.js
mongosh brainrot_analytics resumen_1_scorecard_global.js
# ...etc
```

O dentro de mongosh:

```javascript
use brainrot_analytics
load("/home/delia/Descargas/archive/scripts/00_limpieza_raw_to_clean.js")
```

> Requisito previo: las colecciones `raw_global_addiction`, `raw_country_addiction` y
> `raw_screen_time_behavior` deben estar cargadas (importadas desde los CSV originales).
