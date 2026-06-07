// =============================================================
// Colección Resumen 1: Scorecard Global
// Colección origen : clean_global_addiction
// Colección destino: resumen_scorecard_global  (PERSISTE con $out)
//
// Descripción:
//   Condensa toda la colección en UN solo documento con los KPIs
//   maestros del negocio. Funciona como portada / tablero ejecutivo.
//
// Preguntas que responde:
//   - ¿Cuál es el nivel global de riesgo de la población? (% en riesgo)
//   - ¿Cuánto se consume en promedio en cada plataforma?
//   - ¿Cuánto duerme en promedio la población?
//   - ¿Qué proporción de usuarios tiene un uso nocturno alto?
// =============================================================

db.clean_global_addiction.aggregate([
  {
    // _id: null => colapsa TODA la colección en un único documento de KPIs
    $group: {
      _id: null,
      usuarios:           { $sum: 1 },                          // total de usuarios analizados
      score_prom:         { $avg: "$addiction_score" },         // adicción promedio global
      sleep_prom:         { $avg: "$sleep_hours" },             // horas de sueño promedio
      tiktok_min_prom:    { $avg: "$tiktok_minutes_daily" },    // consumo medio TikTok
      instagram_min_prom: { $avg: "$instagram_minutes_daily" }, // consumo medio Instagram
      // contador condicional: usuarios en riesgo (High o Severe)
      en_riesgo:          { $sum: { $cond: [ { $in: ["$addiction_level", ["High", "Severe"]] }, 1, 0 ] } },
      // contador condicional: usuarios con uso nocturno alto (>= 75%)
      uso_nocturno_alto:  { $sum: { $cond: [ { $gte: ["$night_usage_ratio_pct", 75] }, 1, 0 ] } }
    }
  },
  {
    // Convierte los conteos en porcentajes y redondea para presentación
    $project: {
      _id: 0,
      usuarios: 1,
      score_prom:         { $round: ["$score_prom", 2] },
      sleep_prom:         { $round: ["$sleep_prom", 2] },
      tiktok_min_prom:    { $round: ["$tiktok_min_prom", 2] },
      instagram_min_prom: { $round: ["$instagram_min_prom", 2] },
      pct_en_riesgo:         { $round: [ { $multiply: [ { $divide: ["$en_riesgo", "$usuarios"] }, 100 ] }, 2 ] },
      pct_uso_nocturno_alto: { $round: [ { $multiply: [ { $divide: ["$uso_nocturno_alto", "$usuarios"] }, 100 ] }, 2 ] }
    }
  },
  // Persiste el resultado en la colección resumen
  { $out: "resumen_scorecard_global" }
]);

// Verificación
db.resumen_scorecard_global.find().pretty();   // 1 documento
