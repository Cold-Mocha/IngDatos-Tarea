// =============================================================
// Aggregation 1: Tiempo promedio de pantalla por grupo etario y plataforma
// Colección origen: clean_screen_time_behavior  (solo TikTok e Instagram)
// Tipo: agregación analítica (NO persiste)
//
// Pregunta de negocio:
//   ¿Cuánto tiempo de pantalla consume en promedio cada grupo etario
//   en cada red social, entre semana, fin de semana y en un día tipo?
// =============================================================

db.clean_screen_time_behavior.aggregate([
  {
    // Agrupa por la combinación grupo etario + plataforma
    $group: {
      _id: {
        age_group: "$age_group",
        platform: "$platform"
      },
      registros:         { $sum: 1 },
      prom_entre_semana: { $avg: "$weekday_screen_hours" },
      prom_fin_semana:   { $avg: "$weekend_screen_hours" }
    }
  },
  {
    $project: {
      _id: 0,
      grupo_etario: "$_id.age_group",
      plataforma:   "$_id.platform",
      registros: 1,
      prom_entre_semana: { $round: ["$prom_entre_semana", 2] },
      prom_fin_semana:   { $round: ["$prom_fin_semana", 2] },
      // Promedio diario ponderado: 5 días entre semana + 2 de fin de semana
      prom_diario: {
        $round: [
          {
            $divide: [
              {
                $add: [
                  { $multiply: ["$prom_entre_semana", 5] },
                  { $multiply: ["$prom_fin_semana", 2] }
                ]
              },
              7
            ]
          },
          2
        ]
      }
    }
  },
  { $sort: { grupo_etario: 1, plataforma: 1 } }
]);
