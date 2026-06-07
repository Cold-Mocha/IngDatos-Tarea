// =============================================================
// Estrategia de índices — BrainRot Analytics
//
// Objetivo: optimizar las 3 familias de consultas frecuentes:
//   1) Usuarios en riesgo por año
//   2) Comportamiento por plataforma y grupo etario
//   3) Consultas por país para análisis comparativos
//
// Procedimiento de demostración:
//   A) Medir ANTES con explain() -> se espera COLLSCAN
//   B) Crear los índices
//   C) Medir DESPUÉS con explain() -> se espera IXSCAN
// =============================================================


// -------------------------------------------------------------
// A) ANTES: ejecutar ESTO primero (sin índices) para capturar el COLLSCAN
//    Fíjate en: winningPlan.stage = "COLLSCAN" y totalDocsExamined = total de la colección
// -------------------------------------------------------------
db.clean_global_addiction.find(
  { year: 2024, addiction_level: { $in: ["High", "Severe"] } }
).explain("executionStats");


// -------------------------------------------------------------
// B) CREAR LOS ÍNDICES
// -------------------------------------------------------------

// 1) Usuarios en riesgo por año (filtra year + addiction_level, ordena por score)
db.clean_global_addiction.createIndex(
  { year: 1, addiction_level: 1, addiction_score: -1 },
  { name: "idx_global_year_level_score" }
);

// 2) Comportamiento digital por plataforma y grupo etario
db.clean_screen_time_behavior.createIndex(
  { platform: 1, age_group: 1, year: 1 },
  { name: "idx_screen_platform_age_year" }
);

// 3) Consultas por país en la colección principal (filtra/ordena por score)
db.clean_global_addiction.createIndex(
  { country: 1, addiction_score: -1 },
  { name: "idx_global_country_score" }
);

// 4) Clave de país en la colección agregada (apoya $lookup y comparativas)
db.clean_country_addiction.createIndex(
  { country: 1 },
  { name: "idx_country_name" }
);


// -------------------------------------------------------------
// C) DESPUÉS: volver a medir. Ahora se espera IXSCAN
//    Fíjate en: winningPlan usa "IXSCAN" con indexName del índice creado
//    y totalDocsExamined mucho menor.
// -------------------------------------------------------------

// Verifica idx_global_year_level_score
db.clean_global_addiction.find(
  { year: 2024, addiction_level: { $in: ["High", "Severe"] } }
).explain("executionStats");

// Verifica idx_screen_platform_age_year
db.clean_screen_time_behavior.find(
  { platform: "TikTok", age_group: "Teen", year: 2024 }
).explain("executionStats");

// Verifica idx_global_country_score
db.clean_global_addiction.find(
  { country: "Indonesia" }
).sort({ addiction_score: -1 }).explain("executionStats");

// Verifica idx_country_name
db.clean_country_addiction.find(
  { country: "Indonesia" }
).explain("executionStats");


// -------------------------------------------------------------
// Listar todos los índices creados (evidencia para el informe)
// -------------------------------------------------------------
db.clean_global_addiction.getIndexes();
db.clean_screen_time_behavior.getIndexes();
db.clean_country_addiction.getIndexes();
