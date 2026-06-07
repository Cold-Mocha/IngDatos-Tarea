// =============================================================
// Consultas frecuentes — BrainRot Analytics
// Versión SIN explain (uso normal) y CON explain (demostración IXSCAN)
// =============================================================


// =============================================================
// PARTE 1 — SIN EXPLAIN (consultas de uso real)
// =============================================================

// 1) Usuarios en riesgo (High/Severe) en un año específico, ordenados por gravedad
db.clean_global_addiction.find(
  { year: 2024, addiction_level: { $in: ["High", "Severe"] } }
).sort({ addiction_score: -1 });

// 2) Comportamiento en TikTok para un grupo etario y año concretos
db.clean_screen_time_behavior.find(
  { platform: "TikTok", age_group: "Teen", year: 2024 }
);

// 3) Top 10 usuarios más adictos dentro de un país
db.clean_global_addiction.find(
  { country: "Indonesia" }
).sort({ addiction_score: -1 }).limit(10);

// 4) Datos agregados de un país puntual (ficha país / apoyo a $lookup)
db.clean_country_addiction.find(
  { country: "Indonesia" }
);

// 5) Conteo de usuarios en riesgo por año (KPI de evolución temporal)
db.clean_global_addiction.aggregate([
  { $match: { addiction_level: { $in: ["High", "Severe"] } } },
  { $group: { _id: "$year", usuarios_en_riesgo: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);


// =============================================================
// PARTE 2 — CON EXPLAIN (demostración del uso de índices)
// En la salida verificar: stage = "IXSCAN", indexName y
// totalDocsExamined mucho menor que el total de la colección.
// =============================================================

// 1) → idx_global_year_level_score
db.clean_global_addiction.find(
  { year: 2024, addiction_level: { $in: ["High", "Severe"] } }
).sort({ addiction_score: -1 }).explain("executionStats");

// 2) → idx_screen_platform_age_year
db.clean_screen_time_behavior.find(
  { platform: "TikTok", age_group: "Teen", year: 2024 }
).explain("executionStats");

// 3) → idx_global_country_score
db.clean_global_addiction.find(
  { country: "Indonesia" }
).sort({ addiction_score: -1 }).limit(10).explain("executionStats");

// 4) → idx_country_name
db.clean_country_addiction.find(
  { country: "Indonesia" }
).explain("executionStats");

// 5) → idx_global_year_level_score (explain de aggregation)
db.clean_global_addiction.explain("executionStats").aggregate([
  { $match: { addiction_level: { $in: ["High", "Severe"] } } },
  { $group: { _id: "$year", usuarios_en_riesgo: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);
