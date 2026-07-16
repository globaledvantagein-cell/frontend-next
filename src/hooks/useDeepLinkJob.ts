/**
 * Handles deep-linking to a specific job via ?id=... in the URL.
 *
 * If the target job is in the current list, selects it. If not (because it's
 * on a later page), fetches it individually and prepends it to the list.
 *
 * This is the only part of Dashboard that needs to know about deep links —
 * extracting it keeps Dashboard.tsx focused on layout.
 */
import { useEffect, useRef } from 'react';
import type { IJob } from '../types';
import { fetchJobDetail } from '../utils/jobApi';

interface Args {
  deepLinkedJobId: string | null;
  jobs: IJob[];
  loading: boolean;
  isMobile: boolean;
  /** Called when the deep-linked job is identified */
  onResolve: (job: IJob, mobile: boolean) => void;
  /** When the job needs to be prepended to the list */
  prepend: (job: IJob) => void;
}

export function useDeepLinkJob({
  deepLinkedJobId,
  jobs,
  loading,
  isMobile,
  onResolve,
  prepend,
}: Args) {
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!deepLinkedJobId || handledRef.current === deepLinkedJobId) return;

    const target = jobs.find(job => job._id === deepLinkedJobId);
    if (target) {
      handledRef.current = deepLinkedJobId;
      onResolve(target, isMobile);
      return;
    }

    if (loading) return; // wait for initial load

    let cancelled = false;
    fetchJobDetail(deepLinkedJobId)
      .then(res => {
        if (cancelled) return;
        if (res.gated) return; // gated teaser — let the normal flow handle it
        const job = res.job as IJob;
        if (!job) return;
        prepend(job);
        handledRef.current = deepLinkedJobId;
        onResolve(job, isMobile);
      })
      .catch(() => {
        // Job doesn't exist or was deleted — just land on default browse page
        handledRef.current = deepLinkedJobId;
      });

    return () => { cancelled = true; };
  }, [jobs, deepLinkedJobId, isMobile, loading, onResolve, prepend]);
}
