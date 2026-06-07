// =============================================================
// Aggregation 3: Consumo total diario vs capacidad de atención
// Colección origen: clean_global_addiction
// Tipo: agregación analítica (NO persiste)
//
// Pregunta de negocio:
//   ¿A mayor consumo total diario (TikTok + Instagram) disminuye la
//   capacidad de atención y aumenta la adicción?
// =============================================================

db.clean_global_addiction.aggregate([
  {
    // 1) Suma el consumo de ambas plataformas por usuario
    $addFields: {
      minutos_totales: { $add: ["$tiktok_minutes_daily", "$instagram_minutes_daily"] }
    }
  },
  {
    // 2) Agrupa por tramos de consumo total
    $bucket: {
      groupBy: "$minutos_totales",
      boundaries: [0, 150, 250, 350, 10000],   // tramos: <150, 150-250, 250-350, 350+
      default: "Otros",
      output: {
        usuarios:       { $sum: 1 },
        attention_prom: { $avg: "$attention_span_score" },
        score_prom:     { $avg: "$addiction_score" },
        sleep_prom:     { $avg: "$sleep_hours" }
      }
    }
  },
  {
    $project: {
      _id: 0,
      rango_consumo: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 0] },   then: "<150 min" },
            { case: { $eq: ["$_id", 150] }, then: "150-250 min" },
            { case: { $eq: ["$_id", 250] }, then: "250-350 min" },
            { case: { $eq: ["$_id", 350] }, then: "350+ min" }
          ],
          default: "Otros"
        }
      },
      usuarios: 1,
      attention_prom: { $round: ["$attention_prom", 2] },
      score_prom:     { $round: ["$score_prom", 2] },
      sleep_prom:     { $round: ["$sleep_prom", 2] }
    }
  },
  { $sort: { attention_prom: -1 } }
]);


// -------------------------------------------------------------
// EXPLAIN — análisis del plan de ejecución
// $addFields crea un campo calculado (minutos_totales) que ningún
// índice puede cubrir => se espera COLLSCAN.
// Revisar: winningPlan.stage = "COLLSCAN", totalDocsExamined = 10000,
//          totalKeysExamined = 0, executionTimeMillis.
// -------------------------------------------------------------
db.clean_global_addiction.explain("executionStats").aggregate([
  {
    $addFields: {
      minutos_totales: { $add: ["$tiktok_minutes_daily", "$instagram_minutes_daily"] }
    }
  },
  {
    $bucket: {
      groupBy: "$minutos_totales",
      boundaries: [0, 150, 250, 350, 10000],
      default: "Otros",
      output: {
        usuarios:       { $sum: 1 },
        attention_prom: { $avg: "$attention_span_score" },
        score_prom:     { $avg: "$addiction_score" },
        sleep_prom:     { $avg: "$sleep_hours" }
      }
    }
  },
  {
    $project: {
      _id: 0,
      rango_consumo: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 0] },   then: "<150 min" },
            { case: { $eq: ["$_id", 150] }, then: "150-250 min" },
            { case: { $eq: ["$_id", 250] }, then: "250-350 min" },
            { case: { $eq: ["$_id", 350] }, then: "350+ min" }
          ],
          default: "Otros"
        }
      },
      usuarios: 1,
      attention_prom: { $round: ["$attention_prom", 2] },
      score_prom:     { $round: ["$score_prom", 2] },
      sleep_prom:     { $round: ["$sleep_prom", 2] }
    }
  },
  { $sort: { attention_prom: -1 } }
]);
