import type { AppMeta, YearlyWorkspaceData } from '../types';
import { getSupabaseClient, getSupabaseUserId } from '../supabase/client';
import type { YearlyStorageDriver } from './types';

type MetaRow = {
  meta: AppMeta;
};

type YearRow = {
  year: number;
  data: YearlyWorkspaceData;
};

const throwIfError = (error: { message: string } | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

export const supabaseStorage: YearlyStorageDriver = {
  name: 'supabase',
  kind: 'cloud',

  async loadMeta() {
    const supabase = getSupabaseClient();
    const userId = await getSupabaseUserId();
    const { data, error } = await supabase
      .from('toodo_meta')
      .select('meta')
      .eq('user_id', userId)
      .maybeSingle<MetaRow>();

    throwIfError(error);
    return data?.meta ?? null;
  },

  async saveMeta(meta: AppMeta) {
    const supabase = getSupabaseClient();
    const userId = await getSupabaseUserId();
    const { error } = await supabase.from('toodo_meta').upsert({
      user_id: userId,
      meta,
      updated_at: new Date().toISOString(),
    });

    throwIfError(error);
  },

  async listYears() {
    const supabase = getSupabaseClient();
    const userId = await getSupabaseUserId();
    const { data, error } = await supabase
      .from('toodo_yearly_workspaces')
      .select('year')
      .eq('user_id', userId)
      .order('year', { ascending: true })
      .returns<Array<Pick<YearRow, 'year'>>>();

    throwIfError(error);
    return (data ?? []).map((row) => row.year);
  },

  async loadYearData(year: number) {
    const supabase = getSupabaseClient();
    const userId = await getSupabaseUserId();
    const { data, error } = await supabase
      .from('toodo_yearly_workspaces')
      .select('data')
      .eq('user_id', userId)
      .eq('year', year)
      .maybeSingle<Pick<YearRow, 'data'>>();

    throwIfError(error);
    return data?.data ?? null;
  },

  async saveYearData(year: number, data: YearlyWorkspaceData) {
    const supabase = getSupabaseClient();
    const userId = await getSupabaseUserId();
    const { error } = await supabase.from('toodo_yearly_workspaces').upsert({
      user_id: userId,
      year,
      data,
      updated_at: new Date().toISOString(),
    });

    throwIfError(error);
  },

  async deleteYear(year: number) {
    const supabase = getSupabaseClient();
    const userId = await getSupabaseUserId();
    const { error } = await supabase.from('toodo_yearly_workspaces').delete().eq('user_id', userId).eq('year', year);

    throwIfError(error);
  },
};
