import { useQuery } from "@tanstack/react-query";
import type { Color, FinishOption, InfillOption, Material, PrintModel, QualityOption, Settings } from "./types";

const BASE = "/api";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useMaterials() {
  return useQuery({ queryKey: ["materials"], queryFn: () => getJson<Material[]>("/materials") });
}

export function useColors() {
  return useQuery({ queryKey: ["colors"], queryFn: () => getJson<Color[]>("/colors") });
}

export function useQualityOptions() {
  return useQuery({ queryKey: ["quality-options"], queryFn: () => getJson<QualityOption[]>("/quality-options") });
}

export function useInfillOptions() {
  return useQuery({ queryKey: ["infill-options"], queryFn: () => getJson<InfillOption[]>("/infill-options") });
}

export function useFinishOptions() {
  return useQuery({ queryKey: ["finish-options"], queryFn: () => getJson<FinishOption[]>("/finish-options") });
}

export function useModels() {
  return useQuery({ queryKey: ["models"], queryFn: () => getJson<PrintModel[]>("/models") });
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: () => getJson<Settings>("/settings") });
}

/**
 * Combined config needed by the Quote screen's calculator: every catalog
 * axis (material/quality/infill/color) plus the site-wide settings row.
 */
export function useQuoteConfig() {
  const materials = useMaterials();
  const colors = useColors();
  const quality = useQualityOptions();
  const infill = useInfillOptions();
  const finish = useFinishOptions();
  const settings = useSettings();

  return {
    materials: materials.data,
    colors: colors.data,
    quality: quality.data,
    infill: infill.data,
    finish: finish.data,
    settings: settings.data,
    isLoading:
      materials.isLoading ||
      colors.isLoading ||
      quality.isLoading ||
      infill.isLoading ||
      finish.isLoading ||
      settings.isLoading,
    isError:
      materials.isError || colors.isError || quality.isError || infill.isError || finish.isError || settings.isError,
  };
}
