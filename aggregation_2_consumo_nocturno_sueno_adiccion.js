// =============================================================
// Aggregation 2: Consumo nocturno y calidad de sueño vs adicción
// Colección origen: clean_global_addiction
// Tipo: agregación analítica (NO persiste)
//
// Pregunta de negocio:
//   ¿El uso nocturno de redes y la mala calidad de sueño se relacionan
//   con mayores niveles de adicción?
//
// Usa $facet para responder dos preguntas en una sola consulta:
//   A) addiction_score según el % de uso nocturno
//   B) addiction_score según el nivel de calidad de sueño
// =============================================================

db.clean_global_addiction.aggregate([
  {
    $facet: {
      // ---- Rama A: por tramo de uso nocturno ----
      por_uso_nocturno: [
        {
          $bucket: {
            groupBy: "$night_usage_ratio_pct",
            boundaries: [0, 25, 50, 75, 101],   // tramos: 0-25, 25-50, 50-75, 75-100
            default: "Otros",
            output: {
              usuarios:   { $sum: 1 },
              score_prom: { $avg: "$addiction_score" },
              sleep_prom: { $avg: "$sleep_hours" }
            }
          }
        },
        {
          $project: {
            _id: 0,
            rango_uso_nocturno: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 0] },  then: "0-25%" },
                  { case: { $eq: ["$_id", 25] }, then: "25-50%" },
                  { case: { $eq: ["$_id", 50] }, then: "50-75%" },
                  { case: { $eq: ["$_id", 75] }, then: "75-100%" }
                ],
                default: "Otros"
              }
            },
            usuarios: 1,
            score_prom: { $round: ["$score_prom", 2] },
            sleep_prom: { $round: ["$sleep_prom", 2] }
          }
        }
      ],
      // ---- Rama B: por nivel de calidad de sueño ----
      por_calidad_sueno: [
        {
          $group: {
            _id: "$sleep_quality_level",
            usuarios:   { $sum: 1 },
            score_prom: { $avg: "$addiction_score" }
          }
        },
        {
          $project: {
            _id: 0,
            calidad_sueno: "$_id",
            usuarios: 1,
            score_prom: { $round: ["$score_prom", 2] }
          }
        },
        { $sort: { score_prom: -1 } }
      ]
    }
  }
]);
