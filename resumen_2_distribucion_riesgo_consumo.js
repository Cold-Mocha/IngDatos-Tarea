// =============================================================
// Colección Resumen 2: Distribución del Riesgo según Minutos de Consumo Diario
// Colección origen : clean_global_addiction
// Colección destino: resumen_matriz_consumo_nivel  (PERSISTE con $out)
//
// Descripción:
//   Matriz cruzada (tabla pivote) de rango de consumo total diario
//   (TikTok + Instagram) contra nivel de adicción. Muestra cómo migra
//   el riesgo a medida que sube el consumo.
//
// Preguntas que responde:
//   - ¿A partir de cuántos minutos diarios la gente salta a High/Severe?
//   - ¿Cómo se reparte cada tramo de consumo entre los 4 niveles?
//   - ¿Existe un umbral de consumo crítico para activar alertas?
// =============================================================

db.clean_global_addiction.aggregate([
  {
    // 1) Construye el consumo total por usuario
    $addFields: {
      minutos_totales: { $add: ["$tiktok_minutes_daily", "$instagram_minutes_daily"] }
    }
  },
  {
    // 2) Clasifica a cada usuario en un tramo de consumo (sin solape, con $lt)
    $addFields: {
      rango_consumo: {
        $switch: {
          branches: [
            { case: { $lt: ["$minutos_totales", 150] }, then: "<150 min" },
            { case: { $lt: ["$minutos_totales", 250] }, then: "150-250 min" },
            { case: { $lt: ["$minutos_totales", 350] }, then: "250-350 min" }
          ],
          default: "350+ min"
        }
      }
    }
  },
  {
    // 3) Agrupa por tramo y descompone el conteo por nivel de adicción
    $group: {
      _id: "$rango_consumo",
      total:  { $sum: 1 },
      Low:    { $sum: { $cond: [ { $eq: ["$addiction_level", "Low"] },    1, 0 ] } },
      Medium: { $sum: { $cond: [ { $eq: ["$addiction_level", "Medium"] }, 1, 0 ] } },
      High:   { $sum: { $cond: [ { $eq: ["$addiction_level", "High"] },   1, 0 ] } },
      Severe: { $sum: { $cond: [ { $eq: ["$addiction_level", "Severe"] }, 1, 0 ] } }
    }
  },
  {
    // 4) Calcula el % en riesgo (High + Severe) de cada tramo
    $project: {
      _id: 0,
      rango_consumo: "$_id",
      total: 1, Low: 1, Medium: 1, High: 1, Severe: 1,
      pct_en_riesgo: {
        $round: [ { $multiply: [ { $divide: [ { $add: ["$High", "$Severe"] }, "$total" ] }, 100 ] }, 2 ]
      }
    }
  },
  { $sort: { pct_en_riesgo: 1 } },
  // Persiste el resultado en la colección resumen
  { $out: "resumen_matriz_consumo_nivel" }
]);

// Verificación
db.resumen_matriz_consumo_nivel.find().sort({ pct_en_riesgo: 1 }).pretty();   // 4 documentos
