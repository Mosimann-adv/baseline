import { useCallback, useEffect, useState } from "react";
import { isDemo, requireSupabase } from "../lib/supabase";
import { isDuplicateKey, isNetworkError, isRlsError, RLS_BLOCKED_MESSAGE } from "../lib/errors";
import { dropManyFromQueue, enqueue, flushQueue, type QueueItem } from "../lib/offlineQueue";
import { accountCacheBlocked, cacheEpoch, readCached, writeCached } from "../lib/cache";

interface LogConfig<Row extends { id: string }, Input, Item extends QueueItem> {
  /** Tabela no banco (training_sessions ou skill_tests). */
  table: string;
  /** Coluna de data usada na ordenação (performed_on ou tested_on). */
  orderColumn: string;
  loadError: string;
  demoList: (guardianId: string) => Row[];
  demoCreate: (guardianId: string, input: Input) => void;
  newQueued: (guardianId: string, input: Input) => Item;
  toRow: (item: Item) => Record<string, unknown>;
  mergePending: (guardianId: string, server: Row[]) => Row[];
}

/**
 * Fábrica dos hooks de registros do responsável (useSessions e useTests eram gêmeos).
 * Carrega do servidor, mescla com a fila offline e cria com a mesma cadeia de erros:
 * duplicado ignora, rede caiu enfileira, RLS enfileira bloqueado com motivo.
 */
export function createLogHook<Row extends { id: string }, Input, Item extends QueueItem>(config: LogConfig<Row, Input, Item>) {
  return function useLog(guardianId: string) {
    const [cached] = useState(() => isDemo ? null : readCached<Row[]>(guardianId, config.table));
    const [rows, setRows] = useState<Row[]>(() => config.mergePending(guardianId, Array.isArray(cached) ? cached : []));
    const [loading, setLoading] = useState(!Array.isArray(cached));
    const [error, setError] = useState<string | null>(null);

    // `loading` só vale para a primeira carga: recarregar depois de salvar não pode trocar a tela
    // pela de carregamento (a tela aberta seria desmontada no meio da edição).
    const reload = useCallback(async () => {
      const epoch = cacheEpoch(guardianId);
      if (isDemo) {
        setRows(config.demoList(guardianId));
        setError(null);
        setLoading(false);
        return;
      }
      // Paginar contorna o teto padrão da API: totais e conquistas usam o histórico inteiro.
      const server: Row[] = [];
      let failed = false;
      for (let offset = 0; ; offset += 1000) {
        const { data, error: queryError } = await requireSupabase().from(config.table).select("*")
          .eq("guardian_id", guardianId).order(config.orderColumn, { ascending: false }).order("created_at", { ascending: false }).order("id")
          .range(offset, offset + 999);
        if (queryError) { failed = true; break; }
        const page = data as Row[];
        server.push(...page);
        if (page.length < 1000) break;
      }
      if (epoch !== cacheEpoch(guardianId) || accountCacheBlocked(guardianId)) return;
      if (failed) {
        setError(config.loadError);
        setRows((previous) => config.mergePending(guardianId, previous));
      } else {
        dropManyFromQueue(guardianId, server.map((row) => row.id));
        writeCached(guardianId, config.table, server, epoch);
        setRows(config.mergePending(guardianId, server));
        setError(null);
      }
      setLoading(false);
    }, [guardianId]);

    const sync = useCallback(async () => {
      if (isDemo) return;
      // Chamado na volta da internet e no "Tentar agora": momento de insistir nos itens desistidos.
      await flushQueue(guardianId, { resetRetries: true });
      await reload();
    }, [guardianId, reload]);

    useEffect(() => {
      void reload().then(() => {
        if (!isDemo) void flushQueue(guardianId).then(() => void reload());
      });
    }, [reload, guardianId]);

    useEffect(() => {
      if (isDemo) return;
      const onOnline = () => void sync();
      window.addEventListener("online", onOnline);
      return () => window.removeEventListener("online", onOnline);
    }, [sync]);

    const create = useCallback(
      async (input: Input): Promise<void> => {
        if (isDemo) {
          config.demoCreate(guardianId, input);
          await reload();
          return;
        }
        const item = config.newQueued(guardianId, input);
        const epoch = cacheEpoch(guardianId);
        const keepOnDevice = () => {
          if (epoch !== cacheEpoch(guardianId) || accountCacheBlocked(guardianId)) throw new Error("O perfil ou a conta mudou durante o salvamento. Confira o rascunho antes de tentar novamente.");
          enqueue(item);
          setRows((previous) => config.mergePending(guardianId, previous));
        };
        // Offline conhecido não espera timeouts/retries do cliente HTTP para dar o recibo.
        if (!navigator.onLine) { keepOnDevice(); return; }
        try {
          const { error: insertError } = await requireSupabase().from(config.table).insert(config.toRow(item));
          if (insertError) {
            if (isDuplicateKey(insertError)) {
              await reload();
              return;
            }
            if (isNetworkError(insertError)) {
              keepOnDevice();
              return;
            }
            if (isRlsError(insertError)) {
              enqueue({ ...item, blocked: true, lastError: RLS_BLOCKED_MESSAGE });
              throw insertError;
            }
            throw insertError;
          }
        } catch (err) {
          if (isNetworkError(err)) {
            keepOnDevice();
            return;
          }
          throw err;
        }
        // O servidor confirmou o insert: o recibo e a meta não dependem do GET seguinte.
        if (epoch !== cacheEpoch(guardianId) || accountCacheBlocked(guardianId)) return;
        const confirmed = { ...config.toRow(item), created_at: item.createdAt } as unknown as Row;
        const previousCache = readCached<Row[]>(guardianId, config.table) ?? [];
        writeCached(guardianId, config.table, [confirmed, ...previousCache.filter((row) => row.id !== item.id)]);
        setRows((previous) => [confirmed, ...previous.filter((row) => row.id !== item.id)]);
        void reload();
      },
      [guardianId, reload],
    );

    return { rows, loading, error, reload, create, sync, hasCache: Array.isArray(cached) };
  };
}
