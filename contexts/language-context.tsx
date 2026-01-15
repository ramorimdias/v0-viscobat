"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Language = "FR" | "EN"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<string, Record<Language, string>> = {
  // App
  app_title: { FR: "Viscobat v2.0", EN: "Viscobat v2.0" },

  // Tabs
  tab_vi: { FR: "VI (ASTM D2270)", EN: "VI (ASTM D2270)" },
  tab_temp: { FR: "Extrapolation T", EN: "T Extrapolation" },
  tab_mixture: { FR: "Mélange → Viscosité", EN: "Blend → Viscosity" },
  tab_two_bases: { FR: "Viscosité cible", EN: "Target Viscosity" },
  tab_solver: { FR: "Mélanges complexes", EN: "Complex Blends" },

  // Headings
  vi_heading: { FR: "Indice de Viscosité (ASTM D2270)", EN: "Viscosity Index (ASTM D2270)" },
  temp_heading: { FR: "Extrapolation en température", EN: "Temperature Extrapolation" },
  mixture_heading: { FR: "Mélange → Viscosité", EN: "Blend → Viscosity" },
  two_bases_heading: { FR: "Viscosité cible → Mélange", EN: "Target Viscosity → Blend" },
  solver_heading: { FR: "Mélanges complexes", EN: "Complex Blends" },

  // Descriptions
  vi_description: {
    FR: "Calculez l'indice de viscosité à partir de deux points température/viscosité selon la norme ASTM D2270",
    EN: "Calculate viscosity index from two temperature/viscosity data points using ASTM D2270",
  },
  temp_description: {
    FR: "Extrapolez les propriétés du fluide à différentes températures en utilisant la corrélation de Walther",
    EN: "Extrapolate fluid properties at different temperatures using the Walther correlation",
  },
  mixture_description: {
    FR: "Calculez la viscosité d'un mélange à partir des pourcentages massiques de ses constituants",
    EN: "Calculate mixture viscosity from the mass percentages of its components",
  },
  target_description: {
    FR: "Trouvez les proportions de mélange pour atteindre une viscosité cible",
    EN: "Find blend proportions to achieve a target viscosity",
  },
  solver_description: {
    FR: "Résolvez des problèmes de formulation complexes avec plusieurs contraintes",
    EN: "Solve complex formulation problems with multiple constraints",
  },

  // Labels
  label_v1: { FR: "Viscosité 1 (mm²/s)", EN: "Viscosity 1 (mm²/s)" },
  label_v2: { FR: "Viscosité 2 (mm²/s)", EN: "Viscosity 2 (mm²/s)" },
  label_t1: { FR: "Température 1 (°C)", EN: "Temperature 1 (°C)" },
  label_t2: { FR: "Température 2 (°C)", EN: "Temperature 2 (°C)" },
  label_target_temp: { FR: "Température cible (°C)", EN: "Target temperature (°C)" },
  label_target_mix: { FR: "Viscosité du mélange cible (mm²/s)", EN: "Target mixture viscosity (mm²/s)" },
  label_baseA: { FR: "Viscosité du constituant A (mm²/s)", EN: "Viscosity of component A (mm²/s)" },
  label_baseB: { FR: "Viscosité du constituant B (mm²/s)", EN: "Viscosity of component B (mm²/s)" },
  walther_log_base: { FR: "Base log", EN: "Log base" },

  // Card titles
  input_data: { FR: "Données d'entrée", EN: "Input Data" },
  results: { FR: "Résultats", EN: "Results" },
  components: { FR: "Constituants", EN: "Components" },
  data_points: { FR: "Points de données", EN: "Data Points" },
  target_config: { FR: "Configuration cible", EN: "Target Configuration" },
  constraints: { FR: "Contraintes", EN: "Constraints" },

  // Card descriptions
  input_two_points: {
    FR: "Entrez deux mesures de viscosité à différentes températures",
    EN: "Enter two viscosity measurements at different temperatures",
  },
  calculated_params: { FR: "Paramètres de viscosité calculés", EN: "Calculated viscosity parameters" },
  add_components_desc: {
    FR: "Ajoutez les constituants de votre mélange avec leurs viscosités",
    EN: "Add mixture components with their viscosities",
  },
  add_data_points_desc: {
    FR: "Entrez les points de données température/propriété",
    EN: "Enter temperature/property data points",
  },
  define_target_desc: {
    FR: "Définissez la viscosité cible et les viscosités des deux constituants",
    EN: "Define target viscosity and both component viscosities",
  },
  define_constraints_desc: {
    FR: "Définissez les contraintes pour chaque constituant",
    EN: "Define constraints for each component",
  },

  // Buttons
  btn_calculate: { FR: "Calculer", EN: "Calculate" },
  btn_solve: { FR: "Résoudre", EN: "Solve" },
  btn_add_component: { FR: "Ajouter un constituant", EN: "Add Component" },
  btn_add_known: { FR: "Ajouter un constituant connu", EN: "Add Known Component" },
  btn_refresh: { FR: "Réinitialiser", EN: "Reset" },
  btn_add_point: { FR: "Ajouter un point", EN: "Add Point" },

  // Table headers
  table_temp: { FR: "Température (°C)", EN: "Temperature (°C)" },
  table_visc: { FR: "Viscosité cinématique (mm²/s)", EN: "Kinematic Viscosity (mm²/s)" },
  table_id: { FR: "ID", EN: "ID" },
  table_percent: { FR: "% massique", EN: "% mass" },
  table_viscosity: { FR: "Viscosité", EN: "Viscosity" },
  table_constraint: { FR: "Contrainte", EN: "Constraint" },
  table_value: { FR: "Valeur", EN: "Value" },

  // Solver constraints
  solver_type: { FR: "Contrainte", EN: "Constraint" },
  solver_value: { FR: "% massique", EN: "% mass" },
  solver_mix: { FR: "Contrainte sur la viscosité du mélange", EN: "Mixture viscosity constraint" },
  solver_mix_type: { FR: "Type", EN: "Type" },
  solver_free: { FR: "Libre", EN: "Free" },
  solver_range: { FR: "Intervalle", EN: "Range" },
  solver_min: { FR: "Minimiser", EN: "Minimize" },
  solver_max: { FR: "Maximiser", EN: "Maximize" },
  solver_set: { FR: "Fixer une valeur", EN: "Set Value" },
  solver_mix_value: { FR: "Viscosité (mm²/s)", EN: "Viscosity (mm²/s)" },
  solver_min_value: { FR: "Min", EN: "Min" },
  solver_max_value: { FR: "Max", EN: "Max" },

  // Results
  vi_result_v40: { FR: "Viscosité à 40 °C :", EN: "Viscosity at 40°C:" },
  vi_result_v100: { FR: "Viscosité à 100 °C :", EN: "Viscosity at 100°C:" },
  vi_result_vi: { FR: "Indice de viscosité :", EN: "Viscosity index:" },
  mixture_result: { FR: "Viscosité du mélange :", EN: "Mixture viscosity:" },
  percent_a: { FR: "Pourcentage du constituant A :", EN: "Percentage of component A:" },
  percent_b: { FR: "Pourcentage du constituant B :", EN: "Percentage of component B:" },
  target_result: { FR: "Valeur à la température cible :", EN: "Value at target temperature:" },
  solver_mixture_result: { FR: "Viscosité du mélange résultant :", EN: "Resulting mixture viscosity:" },

  // Sub-tabs
  subtab_kv: { FR: "KV (cSt)", EN: "KV (cSt)" },
  subtab_density: { FR: "Densité (kg/m³)", EN: "Density (kg/m³)" },
  subtab_cp: { FR: "Cp (kJ/kgK)", EN: "Cp (kJ/kgK)" },
  subtab_thermal: { FR: "Conductivité (W/mK)", EN: "Conductivity (W/mK)" },

  // Equations
  walther_equation: { FR: "Ajustement log-log (Walther) :", EN: "Log-log fit (Walther):" },
  linear_equation: { FR: "Régression linéaire :", EN: "Linear regression:" },

  // Messages
  min_two_points: { FR: "Ajoutez au moins deux points valides.", EN: "Add at least two valid points." },
  sum_must_100: { FR: "La somme des pourcentages doit être 100", EN: "Sum of percentages must equal 100" },
  no_components: { FR: "Aucun constituant fourni", EN: "No components provided" },
  enter_data_calculate: { FR: "Entrez vos données et cliquez sur Calculer", EN: "Enter your data and click Calculate" },
  solver_diag_unique: { FR: "Solution unique trouvée.", EN: "Unique solution found." },
  solver_diag_multiple: { FR: "Plusieurs solutions possibles.", EN: "Multiple solutions found." },
  solver_summary_title: { FR: "Résumé des contraintes", EN: "Constraints summary" },
  solver_result_title: { FR: "Résultats", EN: "Results" },
  solver_possible_range: { FR: "Plage faisable", EN: "Feasible range" },

  // Modal
  modal_title: { FR: "Viscobat v2.0", EN: "Viscobat v2.0" },
  modal_subtitle: { FR: "Outil de calcul de viscosité", EN: "Viscosity Calculation Tool" },
  modal_last_update: { FR: "Mise à jour", EN: "Updated" },
  modal_version: { FR: "Version", EN: "Version" },
  modal_author: { FR: "Auteur", EN: "Author" },
  modal_description: {
    FR: "La corrélation logarithmique de Walther est le cœur de cet outil, permettant d'établir avec précision le lien entre viscosité et température pour accompagner vos formulations.",
    EN: "The Walther log correlation is the heart of this tool, enabling a precise link between viscosity and temperature to support your formulations.",
  },
  modal_footer: {
    FR: "Développé avec Next.js et la corrélation de Walther pour une modélisation précise viscosité-température.",
    EN: "Built with Next.js and the Walther correlation for accurate viscosity-temperature modeling.",
  },

  // Tips
  tip_title: { FR: "Astuce", EN: "Quick Tip" },
  tip_vi: {
    FR: "L'indice de viscosité (VI) indique la variation de viscosité d'une huile avec la température. Un VI élevé signifie une viscosité plus stable. La plupart des huiles moteur modernes ont un VI entre 95 et 170.",
    EN: "The Viscosity Index (VI) indicates how much an oil's viscosity changes with temperature. Higher VI means more stable viscosity. Most modern engine oils have VI between 95-170.",
  },
  tip_mixture: {
    FR: "La somme des pourcentages massiques doit être égale à 100%. La viscosité du mélange est calculée en utilisant la moyenne de Walther des logarithmes.",
    EN: "The sum of mass percentages must equal 100%. The mixture viscosity is calculated using the Walther averaging of logarithms.",
  },
  tip_target: {
    FR: "Cette fonction résout les proportions exactes de deux constituants nécessaires pour obtenir une viscosité de mélange spécifique.",
    EN: "This solves for the exact proportions of two components needed to achieve a specific mixture viscosity.",
  },
  tip_temp: {
    FR: "Ajoutez au moins 2 points de données pour générer une courbe de régression. La corrélation de Walther est utilisée pour la viscosité, la régression linéaire pour les autres propriétés.",
    EN: "Add at least 2 data points to generate a regression curve. Walther correlation is used for viscosity, linear regression for other properties.",
  },
  tip_solver: {
    FR: "Définissez les contraintes de chaque constituant : libre, dans un intervalle, minimiser, maximiser ou fixer une valeur exacte.",
    EN: "Set constraints for each component: free, within a range, minimize, maximize, or set an exact value.",
  },

  // Misc
  error: { FR: "Erreur", EN: "Error" },
  beta_label: { FR: "Coefficient de dilatation thermique β :", EN: "Thermal expansion coefficient β:" },
  component: { FR: "Constituant", EN: "Component" },
  remove: { FR: "Supprimer", EN: "Remove" },
  powered_by: { FR: "Propulsé par", EN: "Powered by" },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("EN")

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("language")
    if (storedLanguage === "FR" || storedLanguage === "EN") {
      setLanguage(storedLanguage)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("language", language)
  }, [language])

  const t = (key: string): string => {
    return translations[key]?.[language] ?? key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
