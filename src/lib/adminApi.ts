import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Color,
  ColorInput,
  FinishOption,
  FinishOptionInput,
  InfillOption,
  InfillOptionInput,
  Material,
  MaterialInput,
  PrintModel,
  PrintModelInput,
  QualityOption,
  QualityOptionInput,
  Settings,
  SettingsInput,
} from "./types";

const BASE = "/api";

async function parseOrThrow(res: Response) {
  if (!res.ok) {
    let message = `Request failed with ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
    } catch {
      // response wasn't JSON — keep the generic status-based message
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(parseOrThrow) as Promise<T>;
}

function putJson<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(parseOrThrow) as Promise<T>;
}

function deleteReq(path: string): Promise<null> {
  return fetch(`${BASE}${path}`, { method: "DELETE" }).then(parseOrThrow) as Promise<null>;
}

// --- Auth ---

export function useAdminSession() {
  return useQuery({
    queryKey: ["admin-session"],
    queryFn: () => fetch(`${BASE}/admin/session`).then((r) => r.json()) as Promise<{ loggedIn: boolean }>,
    staleTime: 0,
  });
}

export function useAdminLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => postJson<{ ok: true }>("/admin/login", { password }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-session"] }),
  });
}

export function useAdminLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => postJson<{ ok: true }>("/admin/logout", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-session"] }),
  });
}

// --- Generic per-resource create/update/delete, mirroring server/lib/crud.ts ---

function useResourceMutations<TInput extends object, TRow>(resource: string, queryKey: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const create = useMutation({
    mutationFn: (body: TInput) => postJson<TRow>(`/${resource}`, body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Partial<TInput>) => putJson<TRow>(`/${resource}/${id}`, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteReq(`/${resource}/${id}`),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function useMaterialMutations() {
  return useResourceMutations<MaterialInput, Material>("materials", "materials");
}

export function useColorMutations() {
  return useResourceMutations<ColorInput, Color>("colors", "colors");
}

export function useQualityOptionMutations() {
  return useResourceMutations<QualityOptionInput, QualityOption>("quality-options", "quality-options");
}

export function useInfillOptionMutations() {
  return useResourceMutations<InfillOptionInput, InfillOption>("infill-options", "infill-options");
}

export function useFinishOptionMutations() {
  return useResourceMutations<FinishOptionInput, FinishOption>("finish-options", "finish-options");
}

export function useModelMutations() {
  return useResourceMutations<PrintModelInput, PrintModel>("models", "models");
}

export function useModelImageUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const form = new FormData();
      form.append("image", file);
      return fetch(`${BASE}/models/${id}/image`, { method: "POST", body: form }).then(parseOrThrow) as Promise<PrintModel>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["models"] }),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<SettingsInput>) => putJson<Settings>("/settings", patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
