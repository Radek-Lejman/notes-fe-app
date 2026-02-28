import React, { useEffect, useMemo, useRef, useState } from "react";
import axios, { type AxiosInstance } from "axios";

/** BE returns at least `id` + requested `fields` */
type Note = {
  id: string;
  title?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  parentId?: string | null;
};

type Order = "rank" | "-rank" | "updatedAt" | "-updatedAt";
type FieldsPreset =
  | "title"
  | "title,content"
  | "title,updatedAt"
  | "title,content,updatedAt";

const BASE_URL = "http://localhost:3000";
const DEFAULT_FIELDS: FieldsPreset = "title,content";
const DEFAULT_LIMIT = 20;
const DEFAULT_ORDER: Order = "rank";

/** Axios instance w/ cookies */
function createApi(): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
  });
}

async function fetchCsrfToken(api: AxiosInstance): Promise<string> {
  const res = await api.get("/csrf-token");
  return res.data?.csrfToken ?? "";
}

/** Prosty debounce */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

const Search: React.FC = () => {
  const apiRef = useRef<AxiosInstance>(createApi());
  const [csrf, setCsrf] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [order, setOrder] = useState<Order>(DEFAULT_ORDER);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [fields, setFields] = useState<FieldsPreset>(DEFAULT_FIELDS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Note[]>([]);

  // Na start pobierz CSRF (wymagany przez BE)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await fetchCsrfToken(apiRef.current);
        if (mounted) setCsrf(token);
      } catch (e: any) {
        if (mounted)
          setError(e?.response?.data?.error || "Failed to fetch CSRF token");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Debounce zapytań po wpisywanym tekście
  const debouncedQ = useDebounced(q, 350);

  // Zmieniamy zapytanie gdy q/order/limit/fields się zmieniają
  useEffect(() => {
    // Nie strzelaj, gdy brak zapytania, albo brak CSRF
    if (!debouncedQ.trim() || !csrf) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = {
          q: debouncedQ,
          limit,
          order,
          fields, // UWAGA: `id` nie dodawaj — BE i tak selektuje id + requested fields
        };

        const res = await apiRef.current.get<Note[]>("/notes/search", {
          params,
          headers: {
            "X-XSRF-TOKEN": csrf,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        setResults(res.data || []);
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        // Spróbuj odświeżyć CSRF przy 403 od csurf
        if (err?.response?.status === 403) {
          try {
            const token = await fetchCsrfToken(apiRef.current);
            setCsrf(token);
          } catch {
            // ignore, pokaż poniżej błąd CSRF
          }
        }
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Search failed"
        );
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQ, order, limit, fields, csrf]);

  const handlePresetChange = (v: FieldsPreset) => setFields(v);

  const controls = useMemo(
    () => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 180px 140px 220px",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          placeholder="Search notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 14,
          }}
        />

        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as Order)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
          title="order"
        >
          <option value="rank">rank ↑ (relevance)</option>
          <option value="-rank">rank ↓ (relevance)</option>
          <option value="updatedAt">updatedAt ↑</option>
          <option value="-updatedAt">updatedAt ↓</option>
        </select>

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
          title="limit"
        >
          {[10, 20, 30, 40, 50].map((n) => (
            <option key={n} value={n}>
              limit: {n}
            </option>
          ))}
        </select>

        <select
          value={fields}
          onChange={(e) => handlePresetChange(e.target.value as FieldsPreset)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
          title="fields"
        >
          <option value="title">fields: title</option>
          <option value="title,content">fields: title,content</option>
          <option value="title,updatedAt">fields: title,updatedAt</option>
          <option value="title,content,updatedAt">
            fields: title,content,updatedAt
          </option>
        </select>
      </div>
    ),
    [q, order, limit, fields]
  );

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h2 style={{ marginBottom: 12 }}>Search</h2>

      {controls}

      {loading && <div style={{ margin: "8px 0" }}>Loading…</div>}
      {error && (
        <div
          style={{
            margin: "8px 0 12px",
            padding: "10px 12px",
            borderRadius: 8,
            background: "#fff5f5",
            color: "#b00020",
            border: "1px solid #ffd7d7",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && q.trim() && (
        <div style={{ color: "#666" }}>No results.</div>
      )}

      {results.length > 0 && (
        <>
          <div style={{ margin: "8px 0 12px", color: "#666" }}>
            Results: <strong>{results.length}</strong>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {results.map((n) => (
              <li
                key={n.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 10,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {n.title ?? "(no title)"}
                </div>
                {n.content ? (
                  <div style={{ color: "#444", whiteSpace: "pre-wrap" }}>
                    {n.content.length > 220
                      ? n.content.slice(0, 220) + "…"
                      : n.content}
                  </div>
                ) : (
                  <div style={{ color: "#888" }}>(no content)</div>
                )}
                <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                  {n.updatedAt && (
                    <>updated: {new Date(n.updatedAt).toLocaleString()}</>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Search;
