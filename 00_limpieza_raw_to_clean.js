// =============================================================
// 00 - LIMPIEZA: RAW -> CLEAN  (ejecutar PRIMERO)
// BrainRot Analytics
//
// Transforma las 3 colecciones RAW en colecciones CLEAN:
//   raw_global_addiction        -> clean_global_addiction
//   raw_country_addiction       -> clean_country_addiction
//   raw_screen_time_behavior    -> clean_screen_time_behavior
//
// Correcciones aplicadas:
//   - Estandarización de tipos (user_id/age/year -> int; métricas -> double)
//   - Redondeo a 2 decimales (precisión excesiva)
//   - addiction_rank -> entero
//   - addiction_level recalculado SIN solape (cortes 25/50/75)
//   - Escalas 0-1 reescaladas a 0-100 (_pct)
//   - Filtro de plataformas: solo TikTok e Instagram
//   - Mapeo de países (USA/UK/UAE -> nombre completo)
//   - Eliminación de duplicados compuestos (user_id+year+platform)
//   - Trim de campos categóricos
// =============================================================


// -------------------------------------------------------------
// 1) clean_global_addiction  (desde raw_global_addiction)
// -------------------------------------------------------------
db.raw_global_addiction.aggregate([
  {
    $addFields: {
      user_id_clean: { $convert: { input: "$user_id", to: "int", onError: null, onNull: null } },
      age_clean:     { $convert: { input: "$age",     to: "int", onError: null, onNull: null } },
      year_clean:    { $convert: { input: "$year",    to: "int", onError: null, onNull: null } },
      country_clean: { $trim: { input: { $toString: "$country" } } },
      tiktok_minutes_daily_clean:     { $convert: { input: "$tiktok_minutes_daily",     to: "double", onError: null, onNull: null } },
      instagram_minutes_daily_clean:  { $convert: { input: "$instagram_minutes_daily",  to: "double", onError: null, onNull: null } },
      sleep_hours_clean:              { $convert: { input: "$sleep_hours",              to: "double", onError: null, onNull: null } },
      sleep_quality_index_clean:      { $convert: { input: "$sleep_quality_index",      to: "double", onError: null, onNull: null } },
      addiction_score_clean:          { $convert: { input: "$addiction_score",          to: "double", onError: null, onNull: null } },
      asi_clean:                      { $convert: { input: "$ASI",                      to: "double", onError: null, onNull: null } },
      mhri_clean:                     { $convert: { input: "$MHRI",                     to: "double", onError: null, onNull: null } },
      attention_span_score_clean:     { $convert: { input: "$attention_span_score",     to: "double", onError: null, onNull: null } },
      dopamine_dependency_score_clean:{ $convert: { input: "$dopamine_dependency_score",to: "double", onError: null, onNull: null } },
      // escalas 0-1 (se reescalan a 0-100)
      gdp_index_clean:             { $convert: { input: "$gdp_index",             to: "double", onError: null, onNull: null } },
      youth_population_ratio_clean:{ $convert: { input: "$youth_population_ratio",to: "double", onError: null, onNull: null } },
      night_usage_ratio_clean:     { $convert: { input: "$night_usage_ratio",     to: "double", onError: null, onNull: null } }
    }
  },
  {
    $match: {
      user_id_clean: { $ne: null },
      age_clean:  { $gte: 0, $lte: 120 },
      year_clean: { $gte: 2015, $lte: 2060 },
      country_clean: { $ne: "" },
      tiktok_minutes_daily_clean:    { $gte: 0 },
      instagram_minutes_daily_clean: { $gte: 0 },
      sleep_hours_clean: { $gte: 0, $lte: 24 },
      sleep_quality_index_clean: { $gte: 0, $lte: 10 },
      addiction_score_clean: { $gte: 0, $lte: 100 }
    }
  },
  {
    $project: {
      _id: 0,
      user_id: "$user_id_clean",
      country: "$country_clean",
      age: "$age_clean",
      year: "$year_clean",
      tiktok_minutes_daily:     { $round: ["$tiktok_minutes_daily_clean", 2] },
      instagram_minutes_daily:  { $round: ["$instagram_minutes_daily_clean", 2] },
      sleep_hours:              { $round: ["$sleep_hours_clean", 2] },
      sleep_quality_index:      { $round: ["$sleep_quality_index_clean", 2] },
      attention_span_score:     { $round: ["$attention_span_score_clean", 2] },
      dopamine_dependency_score:{ $round: ["$dopamine_dependency_score_clean", 2] },
      ASI:  { $round: ["$asi_clean", 2] },
      MHRI: { $round: ["$mhri_clean", 2] },
      addiction_score: { $round: ["$addiction_score_clean", 2] },
      // escalas 0-1 -> 0-100
      gdp_index_pct:              { $round: [{ $multiply: ["$gdp_index_clean", 100] }, 2] },
      youth_population_ratio_pct: { $round: [{ $multiply: ["$youth_population_ratio_clean", 100] }, 2] },
      night_usage_ratio_pct:      { $round: [{ $multiply: ["$night_usage_ratio_clean", 100] }, 2] },
      // addiction_level recalculado SIN solape (cortes 25/50/75)
      addiction_level: {
        $switch: {
          branches: [
            { case: { $lt: ["$addiction_score_clean", 25] }, then: "Low" },
            { case: { $lt: ["$addiction_score_clean", 50] }, then: "Medium" },
            { case: { $lt: ["$addiction_score_clean", 75] }, then: "High" }
          ],
          default: "Severe"
        }
      },
      sleep_quality_level: {
        $switch: {
          branches: [
            { case: { $gte: ["$sleep_quality_index_clean", 7] }, then: "High" },
            { case: { $gte: ["$sleep_quality_index_clean", 5] }, then: "Medium" }
          ],
          default: "Low"
        }
      }
    }
  },
  { $merge: { into: "clean_global_addiction", whenMatched: "replace", whenNotMatched: "insert" } }
]);


// -------------------------------------------------------------
// 2) clean_country_addiction  (desde raw_country_addiction)
//    Corrige exceso de decimales y addiction_rank -> int
// -------------------------------------------------------------
db.raw_country_addiction.aggregate([
  {
    $addFields: {
      country_clean: { $trim: { input: { $toString: "$country" } } },
      tiktok_minutes_daily_c:     { $convert: { input: "$tiktok_minutes_daily",     to: "double", onError: null, onNull: null } },
      instagram_minutes_daily_c:  { $convert: { input: "$instagram_minutes_daily",  to: "double", onError: null, onNull: null } },
      attention_span_score_c:     { $convert: { input: "$attention_span_score",     to: "double", onError: null, onNull: null } },
      dopamine_dependency_score_c:{ $convert: { input: "$dopamine_dependency_score",to: "double", onError: null, onNull: null } },
      sleep_hours_c:     { $convert: { input: "$sleep_hours",     to: "double", onError: null, onNull: null } },
      addiction_score_c: { $convert: { input: "$addiction_score", to: "double", onError: null, onNull: null } },
      asi_c:  { $convert: { input: "$ASI",  to: "double", onError: null, onNull: null } },
      mhri_c: { $convert: { input: "$MHRI", to: "double", onError: null, onNull: null } },
      addiction_rank_c: { $convert: { input: "$addiction_rank", to: "int", onError: null, onNull: null } }
    }
  },
  {
    $match: {
      country_clean: { $ne: "" },
      addiction_rank_c: { $ne: null },
      sleep_hours_c: { $gte: 0, $lte: 24 },
      addiction_score_c: { $gte: 0, $lte: 100 }
    }
  },
  {
    $project: {
      _id: 0,
      country: "$country_clean",
      tiktok_minutes_daily:     { $round: ["$tiktok_minutes_daily_c", 2] },
      instagram_minutes_daily:  { $round: ["$instagram_minutes_daily_c", 2] },
      attention_span_score:     { $round: ["$attention_span_score_c", 2] },
      dopamine_dependency_score:{ $round: ["$dopamine_dependency_score_c", 2] },
      sleep_hours:              { $round: ["$sleep_hours_c", 2] },
      addiction_score:          { $round: ["$addiction_score_c", 2] },
      ASI:  { $round: ["$asi_c", 2] },
      MHRI: { $round: ["$mhri_c", 2] },
      addiction_rank: "$addiction_rank_c"   // entero
    }
  },
  { $merge: { into: "clean_country_addiction", whenMatched: "replace", whenNotMatched: "insert" } }
]);


// -------------------------------------------------------------
// 3) clean_screen_time_behavior  (desde raw_screen_time_behavior)
//    Filtra plataformas, mapea países, castea tipos, dedup
// -------------------------------------------------------------
db.raw_screen_time_behavior.aggregate([
  {
    $addFields: {
      user_id_clean: { $convert: { input: "$user_id", to: "int", onError: null, onNull: null } },
      year_clean:    { $convert: { input: "$year",    to: "int", onError: null, onNull: null } },
      platform_clean:  { $trim: { input: { $toString: "$platform" } } },
      gender_clean:    { $trim: { input: { $toString: "$gender" } } },
      age_group_clean: { $trim: { input: { $toString: "$age_group" } } },
      // mapeo de países: abreviatura -> nombre completo
      country_clean: {
        $let: {
          vars: { c: { $trim: { input: { $toString: "$country" } } } },
          in: {
            $switch: {
              branches: [
                { case: { $eq: ["$$c", "USA"] }, then: "United States" },
                { case: { $eq: ["$$c", "UK"] },  then: "United Kingdom" },
                { case: { $eq: ["$$c", "UAE"] }, then: "United Arab Emirates" }
              ],
              default: "$$c"
            }
          }
        }
      },
      weekday_screen_hours_clean:  { $convert: { input: "$weekday_screen_hours",  to: "double", onError: null, onNull: null } },
      weekend_screen_hours_clean:  { $convert: { input: "$weekend_screen_hours",  to: "double", onError: null, onNull: null } },
      multitasking_frequency_clean:{ $convert: { input: "$multitasking_frequency",to: "double", onError: null, onNull: null } },
      focus_span_minutes_clean:    { $convert: { input: "$focus_span_minutes",    to: "double", onError: null, onNull: null } },
      physical_activity_hours_weekly_clean: { $convert: { input: "$physical_activity_hours_weekly", to: "double", onError: null, onNull: null } }
    }
  },
  {
    $match: {
      platform_clean: { $in: ["TikTok", "Instagram"] },   // solo caso de negocio
      user_id_clean: { $ne: null },
      year_clean: { $gte: 2010, $lte: 2060 },
      country_clean: { $ne: "" },
      multitasking_frequency_clean: { $gte: 0, $lte: 100 },
      weekday_screen_hours_clean: { $gte: 0, $lte: 24 },
      weekend_screen_hours_clean: { $gte: 0, $lte: 24 }
    }
  },
  {
    // dedup compuesto: user_id + year + platform
    $group: {
      _id: { user_id: "$user_id_clean", year: "$year_clean", platform: "$platform_clean" },
      doc: { $first: "$$ROOT" }
    }
  },
  { $replaceRoot: { newRoot: "$doc" } },
  {
    $project: {
      _id: 0,
      user_id: "$user_id_clean",
      year: "$year_clean",
      country: "$country_clean",
      age_group: "$age_group_clean",
      gender: "$gender_clean",
      platform: "$platform_clean",
      weekday_screen_hours: { $round: ["$weekday_screen_hours_clean", 2] },
      weekend_screen_hours: { $round: ["$weekend_screen_hours_clean", 2] },
      multitasking_frequency_pct: { $round: ["$multitasking_frequency_clean", 2] },
      focus_span_minutes: { $round: ["$focus_span_minutes_clean", 2] },
      physical_activity_hours_weekly: { $round: ["$physical_activity_hours_weekly_clean", 2] }
    }
  },
  { $merge: { into: "clean_screen_time_behavior", whenMatched: "replace", whenNotMatched: "insert" } }
]);


// -------------------------------------------------------------
// Verificación de conteos RAW vs CLEAN
// -------------------------------------------------------------
print("global  RAW/CLEAN: " + db.raw_global_addiction.countDocuments()     + " / " + db.clean_global_addiction.countDocuments());
print("country RAW/CLEAN: " + db.raw_country_addiction.countDocuments()    + " / " + db.clean_country_addiction.countDocuments());
print("screen  RAW/CLEAN: " + db.raw_screen_time_behavior.countDocuments() + " / " + db.clean_screen_time_behavior.countDocuments());
