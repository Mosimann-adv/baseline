import { useCallback, useEffect, useState } from "react";
import { isDemo, requireSupabase } from "../lib/supabase";
import { isDuplicateKey, isNetworkError, isRlsError, RLS_BLOCKED_MESSAGE } from "../lib/errors";
import { dropFromQueue, enqueue, flushQueue, type QueueItem } from "../lib/offlineQueue";

interface LogConfig<Row extends { id: string }, Input, Item extends QueueItem> {
  /** Tabela no banco (training_sessions ou skill_tests). */
  table: string;
  /** Coluna de data usada na ordenação (performed_on ou tested_on). */
  orderColumn: string;
  /** Treinos carregam no máximo 300 (padrão do projeto); testes não têm limite. */
  limit?: number;
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
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // `loading` só vale para a primeira carga: recarregar depois de salvar não pode trocar a tela
    // pela de carregamento (a tela aberta seria desmontada no meio da edição).
    const reload = useCallback(async () => {
      if (isDemo) {
        setRows(config.demoList(guardianId));
        setError(null);
        setLoading(false);
        return;
      }
      let query = requireSupabase()
        .from(config.table)
        .select("*")
        .eq("guardian_id", guardianId)
        .order(config.orderColumn, { ascending: false })
        .order("created_at", { ascending: false });
      if (config.limit) query = query.limit(config.limit);
      const { data, error: queryError } = await query;
      if (queryError) setError(config.loadError);
      else {
        const server = data as Row[];
        for (const row of server) dropFromQueue(guardianId, row.id);
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
        try {
          const { error: insertError } = await requireSupabase().from(config.table).insert(config.toRow(item));
          if (insertError) {
            if (isDuplicateKey(insertError)) {
              await reload();
              return;
            }
            if (isNetworkError(insertError)) {
              enqueue(item);
              await reload();
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
            enqueue(item);
            await reload();
            return;
          }
          throw err;
        }
        await reload();
      },
      [guardianId, reload],
    );

    return { rows, loading, error, reload, create, sync };
  };
}
